import { NetworkSnapshot } from "@/types/flight";

// IVAO API v2 nécessite une authentification OAuth2 (client_id/secret) via
// leur portail développeur (https://api.ivao.aero). À implémenter au jour 2
// une fois la clé API obtenue. Structure laissée en place pour brancher
// facilement une fois prêt, en gardant le même format de sortie normalisé
// que l'adapter VATSIM.

export async function fetchIvaoSnapshot(): Promise<NetworkSnapshot> {
  throw new Error(
    "IVAO pas encore branché — nécessite une clé API développeur (api.ivao.aero). À venir."
  );
}
