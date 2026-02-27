export type Athlete = {
  id: string;
  name: string;
  team: string;
  position: string;
  remainingMeetings: number;
  photo: string;
  birthDate?: string | null;
};

export type AthleteReport = {
  id: string;
  athleteId: string;
  title: string;
  createdAt: string; // ISO date string
  tags: string[];
  summary: string;
  metrics: {
    rating: number; // 0-10
    intensity: number; // 0-10
    decision: number; // 0-10
    positioning: number; // 0-10
  };
};

export type ScoutClip = {
  id: string;
  start: number;
  end: number;
  createdAt: number;
  label: string;
  description: string;
  confidence: "baixa" | "média" | "alta";
};

