const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as
  | string
  | undefined;
const IMAGE_PRESET =
  (import.meta.env.VITE_CLOUDINARY_IMAGE_PRESET as string | undefined) ||
  "jard_imagenes";
const AUDIO_PRESET =
  (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined) ||
  IMAGE_PRESET;

export async function uploadImagenToCloudinary(
  file: File,
  folder: string = "general",
): Promise<string> {
  const result = await uploadChatAssetToCloudinary(file, folder);
  return result.url;
}

export async function uploadChatAssetToCloudinary(
  file: File,
  folder: string = "chat",
): Promise<{ url: string; name: string }> {
  if (!CLOUD_NAME) {
    throw new Error("Falta VITE_CLOUDINARY_CLOUD_NAME en el entorno.");
  }

  const isImage = file.type.startsWith("image/");
  const isAudio =
    file.type.startsWith("audio/") || file.type.startsWith("video/");
  const resourceType: "image" | "video" | "raw" = isImage
    ? "image"
    : isAudio
      ? "video"
      : "raw";
  const preset = isAudio ? AUDIO_PRESET : IMAGE_PRESET;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);
  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
    { method: "POST", body: formData },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Error al subir a Cloudinary (${res.status}). Verifica el preset '${preset}'. ${body}`,
    );
  }

  const data = (await res.json()) as { secure_url: string };
  return { url: data.secure_url, name: file.name };
}
