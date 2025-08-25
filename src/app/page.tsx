import MusicianApp from "@/components/MusicianApp";
import Diagnostics from "@/components/Diagnostics";

export default function Home() {
  return (
    <>
      <MusicianApp />
      <div className="mt-6"><Diagnostics /></div>
    </>
  );
}
