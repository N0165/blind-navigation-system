export async function analyzeFrame({ blob, speak = false }) {
  const formData = new FormData();
  formData.append("file", blob, "frame.jpg");

  const response = await fetch(`/api/analyze-frame?speak=${speak}`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Analyze request failed: ${response.status}`);
  }

  return response.json();
}
