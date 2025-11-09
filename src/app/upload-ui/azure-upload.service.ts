import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface AzureUploadConfig {
    storageAccountName: string;
    containerName: string;
    sasToken?: string;
    connectionString?: string;
}

export interface UploadResult {
    fileName: string;
    url: string;
    size: number;
    contentType: string;
    uploadDate: string;
}

@Injectable({
    providedIn: 'root'
})
export class AzureUploadService {
    private http = inject(HttpClient);

    /**
     * Upload file to Azure Blob Storage using SAS token
     */
    uploadWithSAS(file: File, config: AzureUploadConfig): Observable<UploadResult> {
        if (!config.sasToken) {
            return throwError(() => new Error('SAS token is required'));
        }

        const timestamp = new Date().getTime();
        const fileName = `${timestamp}_${file.name}`;

        // Construct blob URL with SAS token
        const blobUrl = `https://${config.storageAccountName}.blob.core.windows.net/${config.containerName}/${fileName}?${config.sasToken}`;

        const headers = new HttpHeaders({
            'x-ms-blob-type': 'BlockBlob',
            'Content-Type': file.type
        });

        return this.http.put(blobUrl, file, {
            headers,
            observe: 'response'
        }).pipe(
            map(response => {
                if (response.status === 201) {
                    const fileUrl = `https://${config.storageAccountName}.blob.core.windows.net/${config.containerName}/${fileName}`;
                    return {
                        fileName: fileName,
                        url: fileUrl,
                        size: file.size,
                        contentType: file.type,
                        uploadDate: new Date().toISOString()
                    };
                } else {
                    throw new Error(`Upload failed with status: ${response.status}`);
                }
            }),
            catchError(error => {
                console.error('Azure upload error:', error);
                return throwError(() => new Error(`Failed to upload ${file.name}: ${error.message}`));
            })
        );
    }

    /**
     * Generate SAS token client-side (for development/testing only)
     * Note: This requires exposing storage account key - NOT recommended for production
     */
    generateClientSideToken(storageAccountName: string, storageAccountKey: string, containerName: string): string {
        // This is a simplified version - in real scenarios, use proper Azure SDK
        const expiryTime = new Date(Date.now() + 3600 * 1000); // 1 hour from now
        const startTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

        // Warning: This is a simplified implementation
        // In production, use Azure SDK or pre-generated tokens
        const sasParams = new URLSearchParams({
            'sv': '2020-08-04',
            'ss': 'b',
            'srt': 'sco',
            'sp': 'racwd',
            'se': expiryTime.toISOString(),
            'st': startTime.toISOString(),
            'spr': 'https'
        });

        // Note: This doesn't include proper signature generation
        // For actual implementation, you'd need to sign with HMAC-SHA256
        console.warn('⚠️ Client-side SAS generation is not secure for production!');

        return sasParams.toString();
    }

    /**
     * Upload using pre-generated SAS token (recommended for frontend-only apps)
     */
    uploadWithPreGeneratedSAS(file: File, storageAccountName: string, containerName: string, preGeneratedSAS: string): Observable<UploadResult> {
        const config: AzureUploadConfig = {
            storageAccountName,
            containerName,
            sasToken: preGeneratedSAS
        };

        return this.uploadWithSAS(file, config);
    }

    /**
     * Upload multiple files
     */
    uploadMultiple(files: File[], config: AzureUploadConfig): Observable<UploadResult[]> {
        const uploadPromises = Array.from(files).map(file =>
            this.uploadWithSAS(file, config).toPromise()
        );

        return new Observable(observer => {
            Promise.all(uploadPromises)
                .then(results => {
                    observer.next(results as UploadResult[]);
                    observer.complete();
                })
                .catch(error => {
                    observer.error(error);
                });
        });
    }

    /**
     * Delete blob from Azure Storage
     */
    deleteBlob(blobName: string, config: AzureUploadConfig): Observable<boolean> {
        if (!config.sasToken) {
            return throwError(() => new Error('SAS token is required for deletion'));
        }

        const deleteUrl = `https://${config.storageAccountName}.blob.core.windows.net/${config.containerName}/${blobName}?${config.sasToken}`;

        return this.http.delete(deleteUrl, { observe: 'response' }).pipe(
            map(response => response.status === 202),
            catchError(error => {
                console.error('Failed to delete blob:', error);
                return throwError(() => new Error(`Failed to delete ${blobName}`));
            })
        );
    }
}