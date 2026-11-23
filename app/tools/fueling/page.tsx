import FuelFinder from "@/app/fuel/_ui/fuel-finder";
import { DEFAULT_KEY, getFuelProducts, toClient } from "@/lib/content/fuel";

export const revalidate = 86400;

export default async function FuelFinderPage() {
  const products = await getFuelProducts();
  return <FuelFinder products={toClient(products)} defaultKey={DEFAULT_KEY} />;
}
