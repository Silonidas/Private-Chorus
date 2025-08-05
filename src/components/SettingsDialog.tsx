import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Volume2, Mic, Users } from "lucide-react";

interface SettingsDialogProps {
  proximityRange: number;
  onProximityRangeChange: (range: number) => void;
  audioInputGain: number;
  onAudioInputGainChange: (gain: number) => void;
  audioOutputVolume: number;
  onAudioOutputVolumeChange: (volume: number) => void;
  echoCancellation: boolean;
  onEchoCancellationChange: (enabled: boolean) => void;
  noiseSuppression: boolean;
  onNoiseSuppressionChange: (enabled: boolean) => void;
}

export const SettingsDialog = ({
  proximityRange,
  onProximityRangeChange,
  audioInputGain,
  onAudioInputGainChange,
  audioOutputVolume,
  onAudioOutputVolumeChange,
  echoCancellation,
  onEchoCancellationChange,
  noiseSuppression,
  onNoiseSuppressionChange,
}: SettingsDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Voice Chat Settings
          </DialogTitle>
          <DialogDescription>
            Configure your audio settings and proximity chat options.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Audio Input Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Audio Input</Label>
            </div>
            
            <div className="space-y-3 pl-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="input-gain" className="text-sm">Input Gain</Label>
                  <span className="text-sm text-muted-foreground">{audioInputGain}%</span>
                </div>
                <Slider
                  id="input-gain"
                  min={0}
                  max={200}
                  step={10}
                  value={[audioInputGain]}
                  onValueChange={(value) => onAudioInputGainChange(value[0])}
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="echo-cancellation" className="text-sm">Echo Cancellation</Label>
                <Switch
                  id="echo-cancellation"
                  checked={echoCancellation}
                  onCheckedChange={onEchoCancellationChange}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="noise-suppression" className="text-sm">Noise Suppression</Label>
                <Switch
                  id="noise-suppression"
                  checked={noiseSuppression}
                  onCheckedChange={onNoiseSuppressionChange}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Audio Output Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Audio Output</Label>
            </div>
            
            <div className="space-y-2 pl-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="output-volume" className="text-sm">Output Volume</Label>
                <span className="text-sm text-muted-foreground">{audioOutputVolume}%</span>
              </div>
              <Slider
                id="output-volume"
                min={0}
                max={100}
                step={5}
                value={[audioOutputVolume]}
                onValueChange={(value) => onAudioOutputVolumeChange(value[0])}
                className="w-full"
              />
            </div>
          </div>

          <Separator />

          {/* Proximity Chat Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Proximity Chat</Label>
            </div>
            
            <div className="space-y-2 pl-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="proximity-range" className="text-sm">Voice Range</Label>
                <span className="text-sm text-muted-foreground">{proximityRange}px</span>
              </div>
              <Slider
                id="proximity-range"
                min={50}
                max={300}
                step={25}
                value={[proximityRange]}
                onValueChange={(value) => onProximityRangeChange(value[0])}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Adjust how close players need to be to hear each other in tabletop mode.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};