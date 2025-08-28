ComfyUI API
================================================================================================================================================================

## Examples
### RUN Workflow
```sh
COMFYUI_URL="http://127.0.0.1:8188/prompt"

prompt_payload=$(cat <<EOF
{"54":{"inputs":{"vae_name":"flux/ae.safetensors"},"class_type":"VAELoader","_meta":{"title":"LoadVAE"}},"55":{"inputs":{"width":1024,"height":1024,"batch_size":1},"class_type":"EmptySD3LatentImage","_meta":{"title":"EmptySD3LatentImage"}},"56":{"inputs":{"unet_name":"flux/flux1-krea-dev_fp8_scaled.safetensors","weight_dtype":"default"},"class_type":"UNETLoader","_meta":{"title":"LoadDiffusionModel"}},"57":{"inputs":{"clip_name1":"clip_l.safetensors","clip_name2":"t5xxl_fp8_e4m3fn.safetensors","type":"flux","device":"default"},"class_type":"DualCLIPLoader","_meta":{"title":"DualCLIPLoader"}},"59":{"inputs":{"guidance":3.5,"conditioning":["60",0]},"class_type":"FluxGuidance","_meta":{"title":"FluxGuidance"}},"60":{"inputs":{"text":"Asideviewofawomanwithstrikingblueeyesandasubtle,naturalsmile,amodern,layereddarkbobhaircutandcurtainbangs.Thehairhasaslightsheenandhintsofsilverorgraystrands.Shehassmallearrings.Sheislookingslightlyawayfromtheviewer.Thebackgroundisasoftlyblurredbeautysalon.","clip":["57",0]},"class_type":"CLIPTextEncode","_meta":{"title":"CLIPTextEncode(Prompt)"}},"61":{"inputs":{"conditioning":["60",0]},"class_type":"ConditioningZeroOut","_meta":{"title":"NegativePromp(Empty)-ConditioningZeroOut"}},"62":{"inputs":{"filename_prefix":"flux_krea/flux_krea","images":["63",0]},"class_type":"SaveImage","_meta":{"title":"SaveImage"}},"63":{"inputs":{"samples":["64",0],"vae":["54",0]},"class_type":"VAEDecode","_meta":{"title":"VAEDecode"}},"64":{"inputs":{"seed":848806973644638,"steps":20,"cfg":1,"sampler_name":"euler","scheduler":"simple","denoise":1,"model":["56",0],"positive":["59",0],"negative":["61",0],"latent_image":["55",0]},"class_type":"KSampler","_meta":{"title":"KSampler"}}}
EOF
)

curl --silent -X POST \
    -H "Content-Type: application/json" \
    -d "{\"prompt\": $prompt_payload}" \
    "$COMFYUI_URL"
```

### CHECK Status
```sh
EXECUTION_ID="7f7eef95-10e9-436d-b0f8-a440425dda64"

COMFYUI_URL="http://127.0.0.1:8188"

curl -s --show-error -X GET \
  "${COMFYUI_URL}/history/${EXECUTION_ID}" | jq .
```