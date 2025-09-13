import fs from 'fs';
import path from 'path';
const __dirname = import.meta.dirname;
const makePayload = (comfyParams) => {

  if (comfyParams.model == 'flux-krea-t2i') {
    const workflowJson = fs.readFileSync(path.join(__dirname, 'workflows/flux-krea-t2i.json'), 'utf8');
    const updatedWorkflow = JSON.parse(workflowJson);
    updatedWorkflow['55'].inputs.width = comfyParams.width;
    updatedWorkflow['55'].inputs.height = comfyParams.height;
    updatedWorkflow['64'].inputs.seed = comfyParams.seed;
    updatedWorkflow['60'].inputs.text = comfyParams.prompt;
    return updatedWorkflow;
  }
};

export default makePayload;