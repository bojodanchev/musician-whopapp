import MusicianApp from "@/components/MusicianApp";

export const dynamic = "force-dynamic";

export default function ExperiencePage({ params }: { params: { experienceId: string } }) {
  // experienceId is provided by Whop when embedding the app
  // We currently render the main UI; future: tailor content by experience/company
  void params.experienceId;
  return <MusicianApp />;
}


