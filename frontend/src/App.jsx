import { useEffect, useRef, useState } from "react";
import ResultPanel from "./components/ResultPanel.jsx";
import { analyzeFrame } from "./services/analyzeFrame.js";

function App() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isContinuousOn, setIsContinuousOn] = useState(false);
  const [speak, setSpeak] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [previewSrc, setPreviewSrc] = useState("");
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [intervalMs, setIntervalMs] = useState(1200);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const objectUrlRef = useRef("");
  const isRequestInFlightRef = useRef(false);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      setIsContinuousOn(false);
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (!isContinuousOn || !isCameraOn) {
      return;
    }

    const timer = setInterval(() => {
      if (!isRequestInFlightRef.current) {
        void captureAndAnalyze({ keepLivePreview: true });
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isContinuousOn, isCameraOn, intervalMs, speak]);

  async function startCamera() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setIsCameraOn(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to access camera");
    }
  }

  function stopCamera() {
    setIsContinuousOn(false);
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  }

  async function submitBlob(blob) {
    isRequestInFlightRef.current = true;
    setIsAnalyzing(true);
    setError("");
    try {
      const response = await analyzeFrame({ blob, speak });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analyze request failed");
    } finally {
      setIsAnalyzing(false);
      isRequestInFlightRef.current = false;
    }
  }

  async function onFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    objectUrlRef.current = URL.createObjectURL(file);
    setPreviewSrc(objectUrlRef.current);
    setResult(null);
    await submitBlob(file);
  }

  async function captureAndAnalyze({ keepLivePreview = false } = {}) {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) {
      setError("Failed to capture camera frame");
      return;
    }

    setFrameSize({ width: canvas.width, height: canvas.height });
    if (!keepLivePreview) {
      setPreviewSrc(canvas.toDataURL("image/jpeg"));
      setResult(null);
    }
    await submitBlob(blob);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">SafePath AI</h1>
          <p className="mt-2 text-slate-400">
            Assistive navigation demo: upload or capture a frame and get the safest next movement.
          </p>
        </header>

        <section className="grid gap-6 rounded-xl border border-slate-800 bg-slate-900/40 p-4 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Input</p>
            <label className="block cursor-pointer rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm hover:border-slate-500">
              Upload Image Frame
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </label>

            <div className="flex flex-wrap gap-2">
              {!isCameraOn ? (
                <button
                  onClick={startCamera}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500"
                >
                  Start Camera
                </button>
              ) : (
                <>
                  <button
                    onClick={captureAndAnalyze}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium hover:bg-emerald-500"
                  >
                    Capture + Analyze
                  </button>
                  <button
                    onClick={() => setIsContinuousOn((prev) => !prev)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium ${
                      isContinuousOn
                        ? "bg-amber-600 hover:bg-amber-500"
                        : "bg-violet-600 hover:bg-violet-500"
                    }`}
                  >
                    {isContinuousOn ? "Stop Live Mode" : "Start Live Mode"}
                  </button>
                  <button
                    onClick={stopCamera}
                    className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium hover:bg-slate-600"
                  >
                    Stop Camera
                  </button>
                </>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-slate-400">
                Live Interval: {intervalMs} ms
              </label>
              <input
                type="range"
                min="800"
                max="2500"
                step="100"
                value={intervalMs}
                onChange={(e) => setIntervalMs(Number(e.target.value))}
                className="w-full accent-violet-500"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={speak}
                onChange={(e) => setSpeak(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800"
              />
              Enable voice command
            </label>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {isAnalyzing && <p className="text-sm text-amber-300">Analyzing frame...</p>}
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wide text-slate-400">Preview</p>
            <div className="relative overflow-hidden rounded-lg border border-slate-800 bg-black">
              {isCameraOn ? (
                <>
                  <video ref={videoRef} autoPlay playsInline className="h-64 w-full object-cover" />
                  <DetectionOverlay result={result} frameSize={frameSize} />
                </>
              ) : previewSrc ? (
                <>
                  <img
                    src={previewSrc}
                    alt="Selected frame preview"
                    onLoad={(e) =>
                      setFrameSize({
                        width: e.currentTarget.naturalWidth,
                        height: e.currentTarget.naturalHeight,
                      })
                    }
                    className="h-64 w-full object-contain"
                  />
                  <DetectionOverlay result={result} frameSize={frameSize} />
                </>
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-slate-500">
                  No frame selected
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </section>

        <ResultPanel result={result} />
      </div>
    </div>
  );
}

function DetectionOverlay({ result, frameSize }) {
  if (!result || !frameSize.width || !frameSize.height) {
    return null;
  }

  const zoneClass = "stroke-sky-400/70 stroke-2";
  const zoneLabelClass = "fill-sky-300 text-[12px] font-medium";

  return (
    <svg
      viewBox={`0 0 ${frameSize.width} ${frameSize.height}`}
      preserveAspectRatio="xMidYMid meet"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <line x1={frameSize.width / 3} y1="0" x2={frameSize.width / 3} y2={frameSize.height} className={zoneClass} />
      <line
        x1={(frameSize.width * 2) / 3}
        y1="0"
        x2={(frameSize.width * 2) / 3}
        y2={frameSize.height}
        className={zoneClass}
      />
      <text x="12" y="20" className={zoneLabelClass}>
        LEFT
      </text>
      <text x={(frameSize.width / 2) - 22} y="20" className={zoneLabelClass}>
        CENTER
      </text>
      <text x={frameSize.width - 60} y="20" className={zoneLabelClass}>
        RIGHT
      </text>

      {(result.detections ?? []).map((det, idx) => {
        const [x1, y1, x2, y2] = det.bbox;
        const color = det.zone === "center" ? "#f59e0b" : "#22c55e";
        return (
          <g key={`${det.label}-${idx}`}>
            <rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill="none" stroke={color} strokeWidth="3" />
            <rect x={x1} y={Math.max(0, y1 - 18)} width="160" height="18" fill={color} opacity="0.9" />
            <text x={x1 + 6} y={Math.max(12, y1 - 5)} fill="#020617" fontSize="12" fontWeight="700">
              {det.label} ({det.zone})
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default App;
