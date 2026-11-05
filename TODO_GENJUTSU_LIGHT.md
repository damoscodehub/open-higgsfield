# Genjutsu Light — implementation plan

## Goal

Add **Genjutsu Light Motion Transfer** to the existing OpenHiggsfield studio.
It must be selectable alongside the current models and render only the inputs,
settings, validation, and result actions supported by Higgsfield's API:

- Model endpoint: `higgsfield/genjutsu-light/motion-transfer/v1.0`
- Required source: one `video_url`
- Required references: one to eight `image_urls`
- Optional `prompt` (empty string allowed; maximum 10,000 characters)
- `resolution`: `480p`, `720p` (default), or `1080p`
- The source is limited to its first 15 seconds and retains its audio.

## What is already in place

- `src/generation/catalog/` is the model registry. Each catalog entry declares
  its label, surface, media roles, and visible settings.
- `src/openhiggsfield/` contains the shared composer, media picker, settings
  rail, gallery, history, and viewer. It is designed to change according to the
  selected catalog entry.
- `src/generation/to-platform.ts` maps a studio generation object to the
  provider's endpoint and request body. Models with unusual body shapes already
  use dedicated mappers.
- `src/generation/actions.ts` makes server-side authenticated requests; the
  browser does not receive the platform key.
- Vercel Blob uploads already produce public URLs suitable for `video_url` and
  `image_urls`.

## Work items

### 1. Define the model

- [x] Add `src/generation/catalog/genjutsu-light.ts`.
- [x] Register it in `src/generation/catalog/index.ts`, first among video
  models.
- [x] Declare surface `video`, one `video` input, up to eight `reference`
  image inputs, and resolution as its only setting.
- [x] Add Genjutsu-specific product copy: motion transfer, source trimmed to
  15 seconds, and source audio preserved.
- [x] Reuse the existing Higgsfield picker mark where appropriate.

### 2. Extend catalog metadata without regressing other models

- [x] Extend `ModelEntry` with optional per-model prompt configuration:
  required/optional, placeholder, and maximum length.
- [x] Add optional minimum media counts per role so a model can require a
  source video and at least one reference image.
- [x] Add optional helper text for a media role and enum values (for example,
  the source-video limit and resolution pricing).
- [x] Keep defaults backward-compatible: existing models retain their current
  required prompt behavior and media rules unless they opt in.

### 3. Map and validate the API request

- [x] Add a dedicated `to-platform.ts` mapper that submits exactly:

  ```json
  {
    "prompt": "",
    "video_url": "…",
    "image_urls": ["…"],
    "resolution": "720p"
  }
  ```

- [x] Use endpoint `higgsfield/genjutsu-light/motion-transfer/v1.0`.
- [x] Validate server-side that there is exactly one video and one to eight
  reference images; reject malformed calls even if client validation is
  bypassed.
- [x] Preserve an intentionally empty prompt as `""`; do not omit it.

### 4. Adapt the composer

- [x] Allow Generate with an empty prompt for this model.
- [x] Limit its prompt editor to 10,000 characters and use a model-specific
  placeholder that explains the prompt is optional.
- [x] Disable Generate until a source video and at least one reference image
  are attached; make the tooltip name the missing input(s).
- [x] Show the video-input note: “First 15 seconds are used; source audio is
  preserved.”
- [x] Render resolution options with their rates: `480p · $0.05/s`,
  `720p · $0.10/s`, and `1080p · $0.20/s`.
- [x] Ensure the model picker describes the one-video / one-to-eight-image
  motion-transfer workflow.

### 5. Preserve all delivered result assets

- [x] Extend the platform status/result types to retain `video.url` plus any
  returned `zip.url`, `mov.url`, `jsx.url`, `fbx.url`, and `ply.url`.
- [x] Store those assets with the run history while preserving existing history
  compatibility.
- [x] Keep `video.url` as the gallery preview/playback asset.
- [x] Add individual download actions for extra result files in the viewer,
  only when they are present.

### 6. Verify and document

- [x] Add focused tests for the request mapper, catalog defaults, media
  validation, and result-status normalization.
- [x] Run type checking and a production build.
- [ ] Manually check Genjutsu Light: empty prompt accepted; missing video or
  reference image blocked; one and eight image references accepted; only the
  resolution control appears; result video plays; optional artifacts download.
- [ ] Regression-check at least one existing image model and one existing video
  model to confirm their prompt, media, settings, generation, and viewer flows
  are unchanged.
- [x] Update the README model count/list and environment/setup notes if the
  implementation changes any user-facing behavior.

## Delivery order

1. Catalog types and Genjutsu entry.
2. Request mapper plus server-side validation.
3. Composer validation, prompt behavior, and UI copy.
4. Status/history/viewer support for optional artifacts.
5. Tests, build, manual regression pass, documentation, and a focused commit.

## Acceptance criteria

Genjutsu Light can be selected, accepts an optional prompt, requires exactly
one source video and one to eight reference images, submits the documented API
body to the documented endpoint, and presents the returned video plus any
optional artifacts. Existing models continue to behave exactly as before.
