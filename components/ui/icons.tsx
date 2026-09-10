import { ArrowLeft as ShapeArrowLeft, ArrowDown as ShapeArrowDown, ArrowRight as ShapeArrowRight, ArrowUp as ShapeArrowUp, AudioLines as ShapeAudioLines, Check as ShapeCheck, ChevronDown as ShapeChevronDown, ChevronRight as ShapeChevronRight, Compass as ShapeCompass, Copy as ShapeCopy, Crosshair as ShapeCrosshair, Download as ShapeDownload, ExternalLink as ShapeExternalLink, FileText as ShapeFileText, GitFork as ShapeGitFork, GitMerge as ShapeGitMerge, GripVertical as ShapeGripVertical, LayoutGrid as ShapeLayoutGrid, Lightbulb as ShapeLightbulb, LoaderCircle as ShapeLoaderCircle, Mic as ShapeMic, MicOff as ShapeMicOff, Minus as ShapeMinus, MoreHorizontal as ShapeMoreHorizontal, PhoneOff as ShapePhoneOff, Plus as ShapePlus, Redo2 as ShapeRedo2, RotateCw as ShapeRotateCw, Shuffle as ShapeShuffle, Undo2 as ShapeUndo2, X as ShapeX } from "lucide-react";
import type { LucideIcon, LucideProps } from "lucide-react";

type IconProps = Omit<LucideProps, "size" | "strokeWidth">;
function standardIcon(Shape: LucideIcon) {
  return function Icon({ className = "", ...props }: IconProps) {
    return <Shape aria-hidden="true" {...props} size={18} strokeWidth={1.75} className={`ui-icon ${className}`} />;
  };
}
export const X = standardIcon(ShapeX);
export const ChevronDown = standardIcon(ShapeChevronDown);
export const CaretDown = standardIcon(ShapeChevronDown);
export const ChevronRight = standardIcon(ShapeChevronRight);
export const CaretRight = standardIcon(ShapeChevronRight);
export const ArrowRight = standardIcon(ShapeArrowRight);
export const ArrowClockwise = standardIcon(ShapeRotateCw);
export const Crosshair = standardIcon(ShapeCrosshair);
export const DownloadSimple = standardIcon(ShapeDownload);
export const GitFork = standardIcon(ShapeGitFork);
export const Copy = standardIcon(ShapeCopy);
export const Compass = standardIcon(ShapeCompass);
export const Shuffle = standardIcon(ShapeShuffle);
export const Undo2 = standardIcon(ShapeUndo2);
export const Redo2 = standardIcon(ShapeRedo2);
export const LayoutGrid = standardIcon(ShapeLayoutGrid);
export const ArrowUp = standardIcon(ShapeArrowUp);
export const LoaderCircle = standardIcon(ShapeLoaderCircle);
export const FileText = standardIcon(ShapeFileText);
export const Lightbulb = standardIcon(ShapeLightbulb);
export const GitMerge = standardIcon(ShapeGitMerge);
export const MoreHorizontal = standardIcon(ShapeMoreHorizontal);
export const AudioLines = standardIcon(ShapeAudioLines);
export const Mic = standardIcon(ShapeMic);
export const MicOff = standardIcon(ShapeMicOff);
export const PhoneOff = standardIcon(ShapePhoneOff);
export const Plus = standardIcon(ShapePlus);
export const Minus = standardIcon(ShapeMinus);
export const GripVertical = standardIcon(ShapeGripVertical);
export const Check = standardIcon(ShapeCheck);
export const ExternalLink = standardIcon(ShapeExternalLink);
export const ArrowLeft = standardIcon(ShapeArrowLeft);
export const ArrowDown = standardIcon(ShapeArrowDown);
