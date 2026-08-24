export type ImageMetadataDTO = {
  originalName: string;
  latitude?: number;
  longitude?: number;
  sizeBytes: number;
  mimeType: string;
};


export type SpotsImages = {
  imageId: string
  imageUrl: string | null
  uploadedAt: string | null,
  sizeBytes: number,
  mimeType: string,
  userName: string | null,
  status: string;
  pictureUrl: string | null
} 

export type getSpotsImagesReturnDTO = {
  id: string;
  alias: string;
  description: string;
  location: string;
  address: string | null;
  createdAt: Date | null;
  images: SpotsImages[]
}