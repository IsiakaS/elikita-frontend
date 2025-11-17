import { Component, ElementRef, inject, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { ErrorService } from '../shared/error.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BytetounitPipe } from "../bytetounit.pipe";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AzureUploadService, AzureUploadConfig } from './azure-upload.service';

@Component({
  selector: 'app-upload-ui',
  imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule, BytetounitPipe],
  templateUrl: './upload-ui.component.html',
  styleUrl: './upload-ui.component.scss'
})
export class UploadUiComponent {

  // File upload restrictions
  photoAllowedFiles = /\.(jpg|jpeg|png|gif|pdf|docx|xlsx|txt)$/i;
  photoMaxFileSize = 52428800; // 50MB
  photoMaxFiles = 5;

  // Azure Storage configuration for file uploads (from azure-upload-demo)
  azureStorageAccountNamie = 'elikita2026kraiyxw7s2ywg'; // Replace with your actual Azure Storage account name
  azureContainerNamie = 'profile'; // Container name for uploads
  azureSasTokeni = 'sv=2024-11-04&ss=bfqt&srt=sco&sp=rwdlacupiyx&se=2030-11-29T00:08:41Z&st=2025-11-08T15:53:41Z&spr=https&sig=ifQ%2B6AN5bXQ5PMs8lfAMpcsS60KwGjivOyjw4mbo14k%3D'; // Replace with your actual SAS token




  @Input() allowedFiles: RegExp = this.photoAllowedFiles;
  @Input() allowedFilesCategoryLabel?: string
  @Input() maxFileSize: number = this.photoMaxFileSize; // in bytes
  @Input() maxFiles: number = this.photoMaxFiles;
  @Input() uploadFieldName: string = 'file';
  @Input() existingFiles?: any[]
  @Input() azureStorageAccountName: string = this.azureStorageAccountNamie;
  @Input() azureContainerName: string = 'profile';
  @Input() azureSasToken?: string = this.azureSasTokeni;

  @Output() filesChanged = new EventEmitter<any[]>();

  allUploadingFiles: any[] = [];
  allUploadedFiles: any[] = [];




  private http = inject(HttpClient);
  private azureUploadService = inject(AzureUploadService);
  ngOnChanges() {
    if (this.existingFiles && this.existingFiles.length) {
      for (const file of this.existingFiles) {
        this.allUploadedFiles.push(file)
      }
    }

  }
  errorService = inject(ErrorService);
  @ViewChild('fileToUpload') realInputFile!: ElementRef;
  selectFileToUpload(event: any): void {
    // alert('select file');
    this.realInputFile.nativeElement.value = "";
    this.realInputFile.nativeElement.click();

  }
  ngAfterViewInit() {

    this.realInputFile.nativeElement.onchange = (event: any) => {
      // alert('change');
      const files = event.target?.files;
      if (files.length > 0) {
        console.log('Selected files:', files);
        for (const file of files) {
          this.allUploadingFiles.push({ ...file, uploadFileSize: file.size, uploadFileName: file.name, uploadFileType: file.type });

          // You can add further processing here, like uploading the file to a server
          if (this.allowedFiles && !this.allowedFiles.test(file.name)) {
            this.errorService.openandCloseError(`File type not allowed: ${file.name}`);
            return;
          }
          if (this.maxFileSize && file.size > this.maxFileSize) {
            this.errorService.openandCloseError(`File size exceeds the limit of ${this.maxFileSize} bytes: ${file.name}`);
            return;
          }
          if (this.maxFiles && this.allUploadingFiles.length > this.maxFiles) {
            this.errorService.openandCloseError(`Maximum number of files exceeded: ${this.maxFiles}`);
            return;
          }
          // Azure Blob Storage upload
          this.uploadToAzureBlob(file);
        }
      }
      else {
        console.log('No file selected');
      }
    }

  }



  deleteFile(fileLink: any, event: Event): void {
    this.allUploadedFiles = this.allUploadedFiles.filter(f => f.fileLink !== fileLink);
    console.log('Deleted file:', fileLink);
  }

  /**
   * Upload file to Azure Blob Storage using the Azure service
   */
  private async uploadToAzureBlob(file: File): Promise<void> {
    try {
      if (!this.azureStorageAccountName) {
        this.errorService.openandCloseError('Azure Storage account name not provided');
        return;
      }

      // Validate SAS token before attempting upload
      if (!this.validateSasToken()) {
        this.allUploadingFiles = this.allUploadingFiles.filter(f => f.uploadFileName !== file.name);
        return;
      }

      const config: AzureUploadConfig = {
        storageAccountName: this.azureStorageAccountName,
        containerName: this.azureContainerName!,
        sasToken: this.azureSasToken
      };

      // Upload file using the Azure service
      this.azureUploadService.uploadWithSAS(file, config).subscribe({
        next: (result) => {
          // File uploaded successfully
          this.allUploadedFiles.push({
            ...file,
            fileLink: result.url,
            uploadFileSize: result.size,
            uploadFileName: file.name,
            uploadFileType: result.contentType,
            azureBlobName: result.fileName,
            uploadDate: result.uploadDate
          });

          // Remove from uploading files
          this.allUploadingFiles = this.allUploadingFiles.filter(f => f.uploadFileName !== file.name);

          console.log('✅ File uploaded to Azure:', result.fileName);

          // Emit the updated files array
          this.filesChanged.emit(this.allUploadedFiles);
        },
        error: (error) => {
          console.error('❌ Error uploading file to Azure:', error);
          this.errorService.openandCloseError(`Failed to upload file: ${file.name}. ${error.message}`);

          // Remove from uploading files on error
          this.allUploadingFiles = this.allUploadingFiles.filter(f => f.uploadFileName !== file.name);
        }
      });

    } catch (error) {
      console.error('❌ Error uploading file to Azure:', error);
      this.errorService.openandCloseError(`Failed to upload file: ${file.name}`);

      // Remove from uploading files on error
      this.allUploadingFiles = this.allUploadingFiles.filter(f => f.uploadFileName !== file.name);
    }
  }  /**
   * Alternative method: Validate SAS token before upload
   */
  private validateSasToken(): boolean {
    if (!this.azureSasToken) {
      this.errorService.openandCloseError('❌ SAS token is required for Azure uploads');
      return false;
    }

    // Check if SAS token contains required parameters
    const requiredParams = ['sv', 'se', 'sp'];
    const hasRequiredParams = requiredParams.every(param =>
      this.azureSasToken!.includes(`${param}=`)
    );

    if (!hasRequiredParams) {
      this.errorService.openandCloseError('❌ Invalid SAS token format');
      return false;
    }

    // Check if token is expired (basic check)
    const expiryMatch = this.azureSasToken.match(/se=([^&]+)/);
    if (expiryMatch) {
      const expiryDate = new Date(decodeURIComponent(expiryMatch[1]));
      if (expiryDate < new Date()) {
        this.errorService.openandCloseError('❌ SAS token has expired. Please generate a new one.');
        return false;
      }
    }

    return true;
  }

  /**
   * Method to refresh/update SAS token when it expires
   */
  updateSasToken(newSasToken: string): void {
    this.azureSasToken = newSasToken;
    console.log('✅ SAS token updated successfully');
  }

  /**
   * Delete file from Azure Storage
   */
  async deleteAzureFile(fileLink: string, azureBlobName: string): Promise<void> {
    if (!this.azureStorageAccountName || !this.azureSasToken) {
      this.errorService.openandCloseError('Azure configuration missing for file deletion');
      return;
    }

    const config: AzureUploadConfig = {
      storageAccountName: this.azureStorageAccountName,
      containerName: this.azureContainerName!,
      sasToken: this.azureSasToken
    };

    this.azureUploadService.deleteBlob(azureBlobName, config).subscribe({
      next: (success) => {
        if (success) {
          this.allUploadedFiles = this.allUploadedFiles.filter(f => f.fileLink !== fileLink);
          console.log('File deleted from Azure:', azureBlobName);

          // Emit the updated files array
          this.filesChanged.emit(this.allUploadedFiles);
        }
      },
      error: (error) => {
        console.error('Error deleting file from Azure:', error);
        this.errorService.openandCloseError('Failed to delete file from Azure');
      }
    });
  }

  getFileExtension(mimeType: string): string {
    if (!mimeType) return '';
    // Extract extension from MIME type (e.g., "image/jpeg" -> "jpeg")
    const parts = mimeType.split('/');
    return parts.length > 1 ? parts[1] : mimeType;
  }

  getFileIcon(mimeType: string): string {
    if (!mimeType) return 'insert_drive_file';

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('application/pdf')) return 'picture_as_pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'description';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'table_chart';
    if (mimeType.startsWith('text/')) return 'article';

    return 'insert_drive_file';
  }

}
