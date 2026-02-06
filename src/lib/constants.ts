export const DELIVERABLE_FORMATS = {
    IMAGES: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    VIDEOS: ['mp4', 'mov', 'webm'],
    DOCUMENTS: ['pdf', 'doc', 'docx'],
    DESIGN_SOURCE_FILES: ['ai', 'psd', 'fig', 'xd']
};

export const ALL_ALLOWED_EXTENSIONS = Object.values(DELIVERABLE_FORMATS).flat();

export const IMAGE_FORMATS = DELIVERABLE_FORMATS.IMAGES;
export const VIDEO_FORMATS = DELIVERABLE_FORMATS.VIDEOS;
export const DOCUMENT_FORMATS = DELIVERABLE_FORMATS.DOCUMENTS;
export const DESIGN_FORMATS = DELIVERABLE_FORMATS.DESIGN_SOURCE_FILES;
