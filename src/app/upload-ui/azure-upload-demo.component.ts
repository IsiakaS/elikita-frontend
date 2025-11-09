import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { AzureConfigService } from './azure-config.service';
import { UploadUiComponent } from './upload-ui.component';

@Component({
    selector: 'app-azure-upload-demo',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatIconModule,
        MatCardModule,
        FormsModule,
        UploadUiComponent
    ],
    template: `
    <div class="demo-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>🔥 Azure Upload Demo (No Backend Required)</mat-card-title>
          <mat-card-subtitle>Configure with pre-generated SAS token</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Configuration Section -->
          <div class="config-section" *ngIf="!isConfigured">
            <h3>📋 Step 1: Configure Azure Settings</h3>
            
            <mat-form-field appearance="outline">
              <mat-label>Storage Account Name</mat-label>
              <input matInput [(ngModel)]="storageAccountName" placeholder="mystorageaccount">
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>Container Name</mat-label>
              <input matInput [(ngModel)]="containerName" placeholder="uploads">
            </mat-form-field>
            
            <mat-form-field appearance="outline">
              <mat-label>SAS Token</mat-label>
              <textarea matInput [(ngModel)]="sasToken" rows="3" 
                placeholder="sv=2020-08-04&ss=b&srt=sco&sp=rwdlacx&se=2026-01-01T00:00:00Z..."></textarea>
              <mat-hint>Get this from Azure Portal → Storage Account → Shared Access Signature</mat-hint>
            </mat-form-field>
            
            <div class="action-buttons">
              <button mat-raised-button color="primary" (click)="saveConfiguration()" 
                [disabled]="!storageAccountName || !containerName || !sasToken">
                💾 Save Configuration
              </button>
              
              <button mat-stroked-button (click)="loadSampleConfig()">
                📝 Load Sample Config
              </button>
            </div>
          </div>
          
          <!-- Status Section -->
          <div class="status-section" *ngIf="isConfigured">
            <h3>✅ Configuration Status</h3>
            <div class="status-info">
              <p><strong>Storage Account:</strong> {{ currentConfig?.storageAccountName }}</p>
              <p><strong>Container:</strong> {{ currentConfig?.containerName }}</p>
              <p><strong>Token Expires:</strong> {{ tokenExpiryText }}</p>
              <p><strong>Status:</strong> 
                <span [class.expired]="isTokenExpired" [class.valid]="!isTokenExpired">
                  {{ isTokenExpired ? '❌ Expired' : '✅ Valid' }}
                </span>
              </p>
            </div>
            
            <div class="action-buttons">
              <button mat-stroked-button (click)="editConfiguration()">
                ✏️ Edit Config
              </button>
              
              <button mat-stroked-button color="warn" (click)="clearConfiguration()">
                🗑️ Clear Config
              </button>
            </div>
          </div>
          
          <!-- Upload Section -->
          <div class="upload-section" *ngIf="isConfigured && !isTokenExpired">
            <h3>📤 Upload Files</h3>
            <app-upload-ui
              [allowedFiles]="allowedFileTypes"
              [allowedFilesCategoryLabel]="'Images, PDFs, Office docs, and text files'"
              [maxFileSize]="10485760"
              [maxFiles]="5"
              [azureStorageAccountName]="currentConfig?.storageAccountName"
              [azureContainerName]="currentConfig?.containerName"
              [azureSasToken]="currentConfig?.sasToken">
            </app-upload-ui>
          </div>
          
          <!-- Help Section -->
          <div class="help-section">
            <h3>❓ How to Get SAS Token</h3>
            <ol>
              <li>Go to <a href="https://portal.azure.com" target="_blank">Azure Portal</a></li>
              <li>Navigate to your Storage Account</li>
              <li>Click "Shared access signature" in the left menu</li>
              <li>Configure:
                <ul>
                  <li>✅ Allowed services: Blob</li>
                  <li>✅ Resource types: Service, Container, Object</li>
                  <li>✅ Permissions: Create, Write, Add, Delete</li>
                  <li>📅 Expiry: 3-6 months from now</li>
                </ul>
              </li>
              <li>Click "Generate SAS and connection string"</li>
              <li>Copy the "SAS token" (starts with sv=...)</li>
            </ol>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
    styles: [`
    .demo-container {
      max-width: 800px;
      margin: 20px auto;
      padding: 20px;
    }
    
    .config-section, .status-section, .upload-section, .help-section {
      margin: 20px 0;
      padding: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }
    
    .status-info p {
      margin: 8px 0;
    }
    
    .valid {
      color: #4caf50;
      font-weight: bold;
    }
    
    .expired {
      color: #f44336;
      font-weight: bold;
    }
    
    .action-buttons {
      margin-top: 20px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    mat-form-field {
      width: 100%;
      margin-bottom: 15px;
    }
    
    .help-section {
      background-color: #f5f5f5;
    }
    
    .help-section ul, .help-section ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    
    .help-section a {
      color: #2196f3;
      text-decoration: none;
    }
    
    .help-section a:hover {
      text-decoration: underline;
    }
  `]
})
export class AzureUploadDemoComponent implements OnInit {
    private azureConfigService = inject(AzureConfigService);

    // File upload configuration
    allowedFileTypes = /\.(jpg|jpeg|png|gif|pdf|docx|xlsx|txt)$/i;

    // Configuration form fields
    storageAccountName = '';
    containerName = 'uploads';
    sasToken = '';

    // Status properties
    isConfigured = false;
    currentConfig = this.azureConfigService.getConfig();
    tokenExpiryText = '';
    isTokenExpired = false; ngOnInit() {
        this.updateStatus();
    }

    saveConfiguration() {
        this.azureConfigService.setConfig({
            storageAccountName: this.storageAccountName,
            containerName: this.containerName,
            sasToken: this.sasToken
        });

        this.updateStatus();
    }

    editConfiguration() {
        const config = this.azureConfigService.getConfig();
        if (config) {
            this.storageAccountName = config.storageAccountName;
            this.containerName = config.containerName;
            this.sasToken = config.sasToken;
        }
        this.isConfigured = false;
    }

    clearConfiguration() {
        this.azureConfigService.clearConfig();
        this.storageAccountName = '';
        this.containerName = 'uploads';
        this.sasToken = '';
        this.updateStatus();
    }

    loadSampleConfig() {
        this.storageAccountName = 'mystorageaccount';
        this.containerName = 'uploads';
        this.sasToken = 'sv=2020-08-04&ss=b&srt=sco&sp=rwdlacx&se=2026-01-01T00:00:00Z&st=2025-11-06T00:00:00Z&spr=https&sig=REPLACE_WITH_YOUR_SIGNATURE';
    }

    private updateStatus() {
        this.currentConfig = this.azureConfigService.getConfig();
        this.isConfigured = !!this.currentConfig;

        if (this.currentConfig) {
            this.tokenExpiryText = this.azureConfigService.getTimeUntilExpiry();
            this.isTokenExpired = this.azureConfigService.isTokenExpired();
        }
    }
}