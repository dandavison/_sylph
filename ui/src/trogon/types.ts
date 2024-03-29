import { LatLngLiteral } from "leaflet";

export interface Settings {
  names: NamesLanguage;
  commonSpeciesOnly: boolean;
  songsOnly: boolean;
  promptIncludesImages: boolean;
  promptIncludesRecording: boolean;
  useFieldModals: boolean;
}

export enum NamesLanguage {
  Scientific = "scientific",
  English = "English",
  Both = "both"
}

export interface LocationRequest {
  ebirdLocId?: string;
  latlng?: LatLngLiteral;
}

export interface EbirdSpecies {
  sciName: string;
  comName: string;
  speciesCode: string;
  category: string;
  taxonOrder: number;
  order: string;
  familyComName: string;
  familySciName: string;
}

export interface Recording {
  url: string;
  familyEn: string;
  familySci: string;
  genus: string;
  speciesEn: string;
  speciesSci: string;
  raw: XenoCantoRecording;
  [index: string]: string | XenoCantoRecording;
}

export interface XenoCantoRecording {
  file: string;
  gen: string;
  sp: string;
  en: string;
  type: string;
  loc: string;
  cnt: string;
}

export interface Answer {
  familySci: string;
  familyEn: string;
  genus: string;
  speciesSci: string;
  speciesEn: string;
  [index: string]: string;
}

export interface SpeciesImages {
  species: string;
  urls: string[];
}

export interface ImageURLMaps {
  speciesSciName2images: Map<string, Set<string>>;
  genus2images: Map<string, Set<string>>;
  familySci2images: Map<string, Set<string>>;
  familyEn2images: Map<string, Set<string>>;
}

export interface ChallengeFamily {
  n: number;
  selected: boolean;
}

export interface LeafletMapEvent {
  latlng: LatLngLiteral;
}
