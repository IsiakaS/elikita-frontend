import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { SecureFhirClientService } from './secure-fhir-client.service';
import { HttpsConfigService } from './https-config.service';

@Component({
    selector: 'app-fhir-security-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatSlideToggleModule,
        MatDividerModule,
        FormsModule
    ],
    template: `
    <div class="security-dashboard">
      <mat-card>
        <mat-card-header>
          <mat-card-title>🔒 FHIR Client Security Dashboard</mat-card-title>
          <mat-card-subtitle>Monitor and configure HTTPS enforcement for FHIR token endpoints</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Security Status -->
          <div class="security-status">
            <h3>🛡️ Security Status</h3>
            
            <div class="status-item" [class.secure]="environmentSecurity.isSecure" [class.insecure]="!environmentSecurity.isSecure">
              <mat-icon>{{ environmentSecurity.isSecure ? 'security' : 'warning' }}</mat-icon>
              <span>Environment: {{ environmentSecurity.isSecure ? 'Secure' : 'Insecure' }}</span>
            </div>
            
            <div class="status-item" [class.secure]="isHttpsEnforced" [class.insecure]="!isHttpsEnforced">
              <mat-icon>{{ isHttpsEnforced ? 'https' : 'http' }}</mat-icon>
              <span>HTTPS Enforcement: {{ isHttpsEnforced ? 'Enabled' : 'Disabled' }}</span>
            </div>
            
            <div *ngIf="environmentSecurity.warnings.length" class="warnings">
              <h4>⚠️ Security Warnings:</h4>
              <ul>
                <li *ngFor="let warning of environmentSecurity.warnings">{{ warning }}</li>
              </ul>
            </div>
          </div>
          
          <mat-divider></mat-divider>
          
          <!-- Configuration -->
          <div class="configuration">
            <h3>⚙️ HTTPS Configuration</h3>
            
            <div class="config-item">
              <mat-slide-toggle 
                [(ngModel)]="config.enforceHttps"
                (change)="updateConfig()">
                Enforce HTTPS
              </mat-slide-toggle>
            </div>
            
            <div class="config-item">
              <mat-slide-toggle 
                [(ngModel)]="config.allowLocalhostHttp"
                (change)="updateConfig()">
                Allow HTTP for localhost
              </mat-slide-toggle>
            </div>
            
            <div class="config-item">
              <mat-slide-toggle 
                [(ngModel)]="config.strictMode"
                (change)="updateConfig()">
                Strict mode (throw errors)
              </mat-slide-toggle>
            </div>
            
            <div class="config-item">
              <mat-slide-toggle 
                [(ngModel)]="config.logSecurityWarnings"
                (change)="updateConfig()">
                Log security warnings
              </mat-slide-toggle>
            </div>
          </div>
          
          <mat-divider></mat-divider>
          
          <!-- Test URLs -->
          <div class="url-testing">
            <h3>🧪 URL Security Testing</h3>
            
            <div class="test-section">
              <h4>Test Token Endpoints:</h4>
              <button mat-raised-button color="primary" (click)="testTokenEndpoint('http://insecure-server.com/token')">
                Test HTTP Token Endpoint
              </button>
              <button mat-raised-button color="primary" (click)="testTokenEndpoint('https://secure-server.com/token')">
                Test HTTPS Token Endpoint
              </button>
            </div>
            
            <div class="test-section">
              <h4>Test FHIR Authorization:</h4>
              <button mat-raised-button color="accent" (click)="testSecureAuthorization()">
                Test Secure Authorization
              </button>
            </div>
            
            <div *ngIf="testResults.length" class="test-results">
              <h4>📋 Test Results:</h4>
              <div *ngFor="let result of testResults" 
                   [class.success]="result.success" 
                   [class.error]="!result.success"
                   class="test-result">
                <mat-icon>{{ result.success ? 'check_circle' : 'error' }}</mat-icon>
                <span>{{ result.message }}</span>
              </div>
            </div>
          </div>
          
          <mat-divider></mat-divider>
          
          <!-- Actions -->
          <div class="actions">
            <button mat-raised-button color="primary" (click)="enableGlobalHttpsEnforcement()">
              🔒 Enable Global HTTPS Enforcement
            </button>
            
            <button mat-stroked-button (click)="resetToDefaults()">
              🔄 Reset to Defaults
            </button>
            
            <button mat-stroked-button color="warn" (click)="clearTestResults()">
              🗑️ Clear Test Results
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
    styles: [`
    .security-dashboard {
      max-width: 800px;
      margin: 20px auto;
      padding: 20px;
    }
    
    .security-status, .configuration, .url-testing, .actions {
      margin: 20px 0;
    }
    
    .status-item {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 10px 0;
      padding: 10px;
      border-radius: 4px;
    }
    
    .status-item.secure {
      background-color: #e8f5e8;
      color: #2e7d32;
    }
    
    .status-item.insecure {
      background-color: #ffebee;
      color: #c62828;
    }
    
    .config-item {
      margin: 15px 0;
    }
    
    .test-section {
      margin: 15px 0;
    }
    
    .test-section button {
      margin: 5px 10px 5px 0;
    }
    
    .test-results {
      margin-top: 20px;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
      max-height: 200px;
      overflow-y: auto;
    }
    
    .test-result {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 8px 0;
      padding: 8px;
      border-radius: 4px;
    }
    
    .test-result.success {
      background-color: #e8f5e8;
      color: #2e7d32;
    }
    
    .test-result.error {
      background-color: #ffebee;
      color: #c62828;
    }
    
    .warnings {
      background-color: #fff3e0;
      padding: 15px;
      border-radius: 4px;
      margin: 15px 0;
    }
    
    .warnings ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    
    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    mat-divider {
      margin: 20px 0;
    }
  `]
})
export class FhirSecurityDashboardComponent implements OnInit {
    private secureFhirService = inject(SecureFhirClientService);
    private httpsConfigService = inject(HttpsConfigService);

    environmentSecurity = { isSecure: false, warnings: [] as string[] };
    config = this.httpsConfigService.getConfig();
    isHttpsEnforced = false;
    testResults: Array<{ success: boolean; message: string; timestamp: Date }> = [];

    ngOnInit() {
        this.updateSecurityStatus();
    }

    updateSecurityStatus() {
        this.environmentSecurity = this.secureFhirService.validateEnvironmentSecurity();
        this.isHttpsEnforced = this.config.enforceHttps;
    }

    updateConfig() {
        this.httpsConfigService.updateConfig(this.config);
        this.updateSecurityStatus();
    }

    testTokenEndpoint(url: string) {
        try {
            const secureUrl = this.secureFhirService['enforceHttps'](url);

            this.addTestResult(true, `✅ Token endpoint converted: ${url} → ${secureUrl}`);

            if (url.startsWith('http://') && this.config.strictMode) {
                this.addTestResult(false, `❌ Strict mode would reject: ${url}`);
            }
        } catch (error) {
            this.addTestResult(false, `❌ Token endpoint test failed: ${error}`);
        }
    }

    testSecureAuthorization() {
        const testParams = {
            clientId: 'test-client',
            scope: 'openid',
            redirectUri: 'http://localhost:4200/callback', // Intentionally HTTP for testing
            iss: 'http://insecure-server.com', // Intentionally HTTP for testing
        };

        try {
            // This will test the URL enforcement without actually calling the server
            const secureIss = this.secureFhirService['enforceHttps'](testParams.iss);
            const secureRedirect = this.secureFhirService['enforceHttps'](testParams.redirectUri);

            this.addTestResult(true, `✅ Authorization URLs secured: ISS(${secureIss}), Redirect(${secureRedirect})`);
        } catch (error) {
            this.addTestResult(false, `❌ Authorization test failed: ${error}`);
        }
    }

    enableGlobalHttpsEnforcement() {
        try {
            this.secureFhirService.enforceHttpsGlobally();
            this.addTestResult(true, '✅ Global HTTPS enforcement enabled for FHIR client');
        } catch (error) {
            this.addTestResult(false, `❌ Failed to enable global enforcement: ${error}`);
        }
    }

    resetToDefaults() {
        this.httpsConfigService.initializeEnvironmentDefaults();
        this.config = this.httpsConfigService.getConfig();
        this.updateSecurityStatus();
        this.addTestResult(true, '🔄 Configuration reset to environment defaults');
    }

    clearTestResults() {
        this.testResults = [];
    }

    private addTestResult(success: boolean, message: string) {
        this.testResults.unshift({
            success,
            message,
            timestamp: new Date()
        });

        // Keep only last 20 results
        if (this.testResults.length > 20) {
            this.testResults = this.testResults.slice(0, 20);
        }
    }
}