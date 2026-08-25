const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const IMAGE_PRESET = import.meta.env.VITE_CLOUDINARY_IMAGE_PRESET || "jard_imagenes";

export async function uploadImagenToCloudinary(
  file: File,
  folder: string = "general"
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", IMAGE_PRESET);
  formData.append("resource_type", "image");
  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    throw new Error("Error al subir imagen a Cloudinary");
  }

  const data = await res.json();
  return data.secure_url;
}
