import { notFound } from "next/navigation";
import Gallery from "../../../components/ui/gallery";

export default function UIReferencePage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <Gallery />;
}
