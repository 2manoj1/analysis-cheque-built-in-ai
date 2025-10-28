"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useChequeSession } from "@/hooks/use-cheque-session"
import { useVoiceVisualizer, VoiceVisualizer } from "react-voice-visualizer"  // Import the hook and component

export function RemarksAudio() {
  const { data: session, update } = useChequeSession()
  const [audioUrl, setAudioUrl] = useState<string>(session?.audioDataUrl ?? "")
  
  // Use the voice visualizer hook to control the audio recorder and visualizer state
  const recorderControls = useVoiceVisualizer();
  const {
    recordedBlob,
    isRecordingInProgress,
    startRecording,
    stopRecording,
    clearCanvas,
  } = recorderControls;

  useEffect(() => {
    if (!recordedBlob) return;
    // Save the recorded audio as a Data URL for playback
    const reader = new FileReader();
    reader.onloadend = () => {
      setAudioUrl(reader.result as string);
      update({ audioDataUrl: reader.result as string });
    };
    reader.readAsDataURL(recordedBlob);
  }, [recordedBlob, update]);

  const handleClear = () => {
    clearCanvas();
    setAudioUrl("");  // Reset the audio URL
    update({ audioDataUrl: "" });
  };

  console.log({session})

  return (
    <Card className="p-4 bg-card text-card-foreground">
      <div className="grid gap-4">
        <div className="grid gap-1">
          <Label htmlFor="remarks">Banker Remarks</Label>
          <Textarea
            id="remarks"
            placeholder="Enter notes about visible tampering, signature doubts, differences in handwriting, etc."
            value={session?.remarks || ""}
            onChange={(e) => update({ remarks: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Remarks are stored locally and included in the final analysis.
          </p>
        </div>

        <div className="grid gap-2">
          <Label>Audio Note (optional)</Label>
          <div className="flex items-center gap-2">
            <Button 
              onClick={isRecordingInProgress ? stopRecording : startRecording} 
              variant={isRecordingInProgress ? "destructive" : "secondary"}
            >
              {isRecordingInProgress ? "Stop Recording" : "Start Recording"}
            </Button>

            {audioUrl && !isRecordingInProgress ? (
              <>
                <audio 
                  className="mt-2" 
                  controls 
                  src={audioUrl} 
                  aria-label="Banker audio remarks playback" 
                />
                <Button onClick={handleClear} variant="outline" className="ml-2">
                  Clear
                </Button>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">No audio recorded yet.</span>
            )}
          </div>

          {/* Audio Visualizer */}
          {isRecordingInProgress && (
            <div className="mt-4">
              <VoiceVisualizer
                controls={recorderControls}  // Pass the controls to the visualizer
                height={200}
                width="100%"
                backgroundColor="transparent"
                mainBarColor="#00C8FF"
                secondaryBarColor="#5e5e5e"
                speed={3}
                barWidth={3}
                gap={1}
                rounded={5}
                isControlPanelShown={false}  // Custom controls, no default UI shown
                isProgressIndicatorShown={false}
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Audio is saved offline. If supported, we attempt to include it in the analysis.
          </p>
        </div>
      </div>
    </Card>
  );
}
