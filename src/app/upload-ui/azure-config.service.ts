import { Injectable } from '@angular/core';

export interface AzureConfig {
    storageAccountName: string;
    containerName: string;
    sasToken: string;
    expiryDate?: Date;
}

@Injectable({
    providedIn: 'root'
})
export class AzureConfigService {
    private config: AzureConfig | null = null;

    /**
     * Set Azure configuration with pre-generated SAS token
     */
    setConfig(config: AzureConfig): void {
        this.config = config;

        // Parse expiry date from SAS token if not provided
        if (!config.expiryDate && config.sasToken) {
            const expiryMatch = config.sasToken.match(/se=([^&]+)/);
            if (expiryMatch) {
                this.config.expiryDate = new Date(decodeURIComponent(expiryMatch[1]));
            }
        }

        console.log('✅ Azure configuration set:', {
            storageAccountName: config.storageAccountName,
            containerName: config.containerName,
            expiryDate: this.config.expiryDate
        });
    }

    /**
     * Get current Azure configuration
     */
    getConfig(): AzureConfig | null {
        return this.config;
    }

    /**
     * Check if SAS token is expired or will expire soon
     */
    isTokenExpired(bufferMinutes = 30): boolean {
        if (!this.config?.expiryDate) return false;

        const now = new Date();
        const bufferTime = new Date(now.getTime() + bufferMinutes * 60 * 1000);

        return this.config.expiryDate <= bufferTime;
    }

    /**
     * Update SAS token (when you generate a new one)
     */
    updateSasToken(newSasToken: string): void {
        if (this.config) {
            this.config.sasToken = newSasToken;

            // Update expiry date
            const expiryMatch = newSasToken.match(/se=([^&]+)/);
            if (expiryMatch) {
                this.config.expiryDate = new Date(decodeURIComponent(expiryMatch[1]));
            }

            console.log('✅ SAS token updated, new expiry:', this.config.expiryDate);
        }
    }

    /**
     * Get time remaining until token expires
     */
    getTimeUntilExpiry(): string {
        if (!this.config?.expiryDate) return 'Unknown';

        const now = new Date();
        const timeDiff = this.config.expiryDate.getTime() - now.getTime();

        if (timeDiff <= 0) return 'Expired';

        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days} days, ${hours} hours`;
        if (hours > 0) return `${hours} hours`;

        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        return `${minutes} minutes`;
    }

    /**
     * Clear configuration
     */
    clearConfig(): void {
        this.config = null;
        console.log('🧹 Azure configuration cleared');
    }
}