export type RetailerLink = {
  retailer: string;
  label: string;
  url: string;
  affiliated: boolean;
};

const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_TAG ?? "";
// Optional deep-link wrappers (e.g. AvantLink/Impact click URLs that take an
// encoded destination). When unset, links go direct so the UX works before
// affiliate accounts are approved.
const RW_WRAP = process.env.NEXT_PUBLIC_RUNNING_WAREHOUSE_LINK_PREFIX ?? "";
const FLEET_FEET_WRAP = process.env.NEXT_PUBLIC_FLEET_FEET_LINK_PREFIX ?? "";
const DICKS_WRAP = process.env.NEXT_PUBLIC_DICKS_LINK_PREFIX ?? "";

const wrap = (prefix: string, url: string) =>
  prefix ? `${prefix}${encodeURIComponent(url)}` : url;

/**
 * Build retailer search links for a shoe. Search URLs (rather than stored
 * product URLs) keep every shoe monetizable without per-shoe curation and
 * never 404 when retailers rename product pages.
 */
export const getRetailerLinks = (shoe: {
  name: string;
  brand: string;
}): RetailerLink[] => {
  const query = encodeURIComponent(shoe.name);

  const amazon = `https://www.amazon.com/s?k=${query}+running+shoes${
    AMAZON_TAG ? `&tag=${AMAZON_TAG}` : ""
  }`;
  const runningWarehouse = `https://www.runningwarehouse.com/searchresults.html?searchterms=${query}`;
  const fleetFeet = `https://www.fleetfeet.com/search?q=${query}`;
  const dicks = `https://www.dickssportinggoods.com/search/SearchDisplay?searchTerm=${query}`;

  return [
    {
      retailer: "amazon",
      label: "Amazon",
      url: amazon,
      affiliated: Boolean(AMAZON_TAG)
    },
    {
      retailer: "running_warehouse",
      label: "Running Warehouse",
      url: wrap(RW_WRAP, runningWarehouse),
      affiliated: Boolean(RW_WRAP)
    },
    {
      retailer: "fleet_feet",
      label: "Fleet Feet",
      url: wrap(FLEET_FEET_WRAP, fleetFeet),
      affiliated: Boolean(FLEET_FEET_WRAP)
    },
    {
      retailer: "dicks",
      label: "Dick's",
      url: wrap(DICKS_WRAP, dicks),
      affiliated: Boolean(DICKS_WRAP)
    }
  ];
};

/**
 * Retailer search links for run fuel. Search pages are more durable than
 * product-detail URLs and can use the same affiliate wrappers as shoes.
 */
export const getFuelRetailerLinks = (product: {
  name: string;
  brand: string;
}): RetailerLink[] => {
  const query = encodeURIComponent(`${product.brand} ${product.name}`);
  const amazon = `https://www.amazon.com/s?k=${query}+energy+gel${
    AMAZON_TAG ? `&tag=${AMAZON_TAG}` : ""
  }`;
  const runningWarehouse = `https://www.runningwarehouse.com/searchresults.html?searchterms=${query}`;
  const fleetFeet = `https://www.fleetfeet.com/search?q=${query}`;

  return [
    {
      retailer: "amazon",
      label: "Amazon",
      url: amazon,
      affiliated: Boolean(AMAZON_TAG)
    },
    {
      retailer: "running_warehouse",
      label: "Running Warehouse",
      url: wrap(RW_WRAP, runningWarehouse),
      affiliated: Boolean(RW_WRAP)
    },
    {
      retailer: "fleet_feet",
      label: "Fleet Feet",
      url: wrap(FLEET_FEET_WRAP, fleetFeet),
      affiliated: Boolean(FLEET_FEET_WRAP)
    }
  ];
};

export const hasAnyAffiliateProgram = () =>
  Boolean(AMAZON_TAG || RW_WRAP || FLEET_FEET_WRAP || DICKS_WRAP);
