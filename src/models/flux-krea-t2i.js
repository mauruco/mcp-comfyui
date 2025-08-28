import fs from 'fs';
import path from 'path';
import config from '../config/index.js';
const __dirname = import.meta.dirname;

class FluxKreaT2I {
  constructor() {
    this.name = config.models['flux-krea-t2i'].name;
    this.fileExtension = config.models['flux-krea-t2i'].fileExtension;
    this.workflowPath = path.join(__dirname, '../workflows', `${config.models['flux-krea-t2i'].name}.json`);
    // Config already includes /flux_krea/ at the end
    this.comfyuiOutputPath = config.models['flux-krea-t2i'].outputFolder;
    // The workflow uses filename_prefix: "flux_krea/flux_krea" 
    // Since config already includes /flux_krea/, ComfyUI will save files as:
    // {output}flux_krea_00001_.png in the flux_krea directory
    this.comfyuiImageSubdir = this.comfyuiOutputPath;
    this.pollingConfig = config.models['flux-krea-t2i'].polling;
    this.defaults = config.models['flux-krea-t2i'].defaults;
    this.limits = config.models['flux-krea-t2i'].limits;
    // Ensure the output directory exists
    this.ensureDirectoryExists(this.comfyuiOutputPath);
  }

  ensureDirectoryExists(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
      }
    } catch (error) {
      console.error(`Error creating directory ${dirPath}: ${error.message}`);
    }
  }

  loadWorkflow() {
    try {
      const workflowJson = fs.readFileSync(this.workflowPath, 'utf8');
      return JSON.parse(workflowJson);
    } catch (error) {
      throw new Error(`Failed to load workflow: ${error.message}`);
    }
  }

  updateWorkflowWithParams(workflow, params) {
    const updatedWorkflow = JSON.parse(JSON.stringify(workflow));
    
    if (updatedWorkflow['55'] && updatedWorkflow['55'].inputs) {
      updatedWorkflow['55'].inputs.width = params.width;
      updatedWorkflow['55'].inputs.height = params.height;
    }
    
    if (updatedWorkflow['64'] && updatedWorkflow['64'].inputs) {
      updatedWorkflow['64'].inputs.seed = params.seed;
    }
    
    if (updatedWorkflow['60'] && updatedWorkflow['60'].inputs) {
      updatedWorkflow['60'].inputs.text = params.prompt;
    }
    
    return updatedWorkflow;
  }

  validateParams(params) {
    if (params.width > this.limits.maxWidth) params.width = this.limits.maxWidth;
    if (params.height > this.limits.maxHeight) params.height = this.limits.maxHeight;
    
    if (!params.output_folder) {
      throw new Error('output_folder is required');
    }
    
    if (!fs.existsSync(params.output_folder)) {
      throw new Error(`Output folder does not exist: ${params.output_folder}`);
    }
    
    return params;
  }

  async monitorImageGeneration(executionId, params, nextFileName, logCallback) {
    const maxAttempts = this.pollingConfig.maxAttempts;
    const pollInterval = this.pollingConfig.interval;
    let attempts = 0;
    
    logCallback(`Monitoring for image with ID: ${nextFileName} for execution ID: ${executionId}`);
    
    const checkForImage = async () => {
      attempts++;
      logCallback(`Checking for generated image (attempt ${attempts}/${maxAttempts}) for execution ID: ${executionId}. Expected image: ${nextFileName}`);
      
      try {
        const { execSync } = await import('child_process');
        
        // Use ls -1t | grep <id> to check for the specific image
        const command = `cd "${this.comfyuiOutputPath}" && ls -1t | grep "${nextFileName}"`;
        logCallback(`Running command: ${command}`);
        
        const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        
        if (result.trim()) {
          const imageName = result.trim();
          logCallback(`Found image: ${imageName}`);
          
          const sourcePath = `${this.comfyuiOutputPath}${imageName}`;
          const destPath = `${params.output_folder}/${imageName}`;
          logCallback(`Attempting to copy from ${sourcePath} to ${destPath}`);
          
          try {
            const { copyFileSync } = await import('fs');
            copyFileSync(sourcePath, destPath);
            logCallback(`Image copied successfully from ${sourcePath} to ${destPath}`);
            return;
          } catch (copyError) {
            logCallback(`Error copying image: ${copyError.message}`);
          }
        } else {
          logCallback(`Image with ID ${expectedImageId} not found yet`);
        }
        
        if (attempts >= maxAttempts) {
          logCallback(`Image monitoring timeout after ${maxAttempts} attempts for execution ID: ${executionId}`);
          return;
        }
        
        setTimeout(checkForImage, pollInterval);
        
      } catch (error) {
        logCallback(`Error checking for image: ${error.message}`);
        setTimeout(checkForImage, pollInterval);
      }
    };
    
    setTimeout(checkForImage, pollInterval);
  }
}

export default FluxKreaT2I;