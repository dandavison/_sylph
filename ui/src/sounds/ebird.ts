import _ from "lodash";

import { fetchMultipleJSON } from "./utils";
import { EbirdHotspot, EbirdObservation } from "types";
import { LeafletLatLng, EbirdSpecies, SpeciesImages } from "./types";

export const ebirdSpecies = {
  getGenus: function(species: EbirdSpecies): string {
    return species.sciName.split(" ")[0] || "";
  },
  getSpeciesSci: function(species: EbirdSpecies): string {
    return species.sciName;
  },
  getSpeciesEn: function(species: EbirdSpecies): string {
    return species.comName;
  },
  getFamilyEn: function(species: EbirdSpecies): string {
    return species.familyComName;
  },
  getFamilySci: function(species: EbirdSpecies): string {
    return species.familySciName;
  }
};

export async function fetchLocationSpecies(
  locIds: string[]
): Promise<EbirdSpecies[]> {
  /// Fetch species lists for each location in parallel
  var speciesCodes = await fetchMultipleJSON(
    locIds.map(
      locId =>
        `${process.env.VUE_APP_SERVER_URL}/proxy/ebird/product/spplist/${locId}?fmt=json`
    )
  );
  speciesCodes = _.union(speciesCodes);
  console.log(
    `Fetched ${speciesCodes.length} species codes for locations: ${locIds.join(
      ","
    )}`
  );
  const species = await fetch(
    `${
      process.env.VUE_APP_SERVER_URL
    }/api/ebird-species?species_codes=${speciesCodes.join(",")}`
  ).then(resp => resp.json());
  console.log(
    `Fetched ${species.length} EbirdSpecies for ebird locations: ${locIds.join(
      ","
    )}`
  );
  return species;
}

export function filterToCommonSpecies(
  locationSpecies: EbirdSpecies[],
  recentObservations: EbirdObservation[]
): EbirdSpecies[] {
  if (recentObservations.length === 0) {
    console.log(`No recent observations`);
    console.log("Not filtering to common species");
    return locationSpecies;
  }
  const recentSpeciesCodes = new Set(
    recentObservations.map(obs => obs.speciesCode)
  );
  const commonSpecies = locationSpecies.filter(sp =>
    recentSpeciesCodes.has(sp.speciesCode)
  );
  console.log(
    `filterToCommonSpecies: ${locationSpecies.length} => ${commonSpecies.length} species`
  );
  return commonSpecies;
}

export async function fetchRecentObservations(
  ebirdLocId: string
): Promise<EbirdObservation[]> {
  return await fetch(
    `${process.env.VUE_APP_SERVER_URL}/proxy/ebird/data/obs/${ebirdLocId}/recent/?back=30`
  ).then(response => response.json());
}

export async function fetchEbirdHotspot(
  ebirdLocId: string
): Promise<EbirdHotspot> {
  return fetch(
    `${process.env.VUE_APP_SERVER_URL}/proxy/ebird/ref/hotspot/info/${ebirdLocId}?fmt=json`
  ).then(response => response.json());
}

export async function fetchEbirdHotspotsByLatLng(
  latlng: LeafletLatLng
): Promise<EbirdHotspot[]> {
  const response = await fetch(
    `${process.env.VUE_APP_SERVER_URL}/proxy/ebird/ref/hotspot/geo?lat=${latlng.lat}&lng=${latlng.lng}&fmt=json`
  );
  return await response.json();
}

export async function fetchSpeciesImages(
  species: EbirdSpecies[]
): Promise<SpeciesImages[]> {
  const speciesString = species.map(sp => sp.sciName).join(",");
  const cachedSpeciesImages: SpeciesImages[] = await fetch(
    `${process.env.VUE_APP_SERVER_URL}/api/species-image-urls?species=${speciesString}&cached_only=true`
  ).then(resp => resp.json());
  const remainingSpeciesNames = _.difference(
    species.map(ebirdSpecies.getSpeciesSci),
    cachedSpeciesImages.map(si => si.species)
  );
  console.log(
    `Got ${cachedSpeciesImages.length} cached species images; \
    fetching remaining ${remainingSpeciesNames.length}`
  );
  // HACK: how to correctly filter to successfully resolved promises only?
  const remainingSpeciesImages = (
    await fetchSpeciesImagesParallel(remainingSpeciesNames)
  )
    .filter(
      result =>
        result.status === "fulfilled" && result.value && result.value.urls
    )
    .map((result: any) => result.value); // result: PromiseFulfilledResult<SpeciesImages> ?

  return _.concat(cachedSpeciesImages, remainingSpeciesImages);
}

async function fetchSpeciesImagesParallel(
  species: string[]
): Promise<PromiseSettledResult<SpeciesImages>[]> {
  return Promise.allSettled(
    species.map(sp =>
      fetch(
        `${process.env.VUE_APP_SERVER_URL}/api/species-image-urls?species=${sp}&cached_only=false`
      )
        .then(resp => resp.json())
        .then(data => data[0])
        .catch(error =>
          console.log(`Error: fetchSpeciesImagesParallel: ${error}`)
        )
    )
  );
}
