const BASE_URL = "https://greenbook.nafdac.gov.ng/";

// The 12 columns the site's table sends, in the same order.
const COLUMNS = [
  "product_name",
  "ingredient.ingredient_name",
  "product_category.name",
  "product_category_id",
  "ingredient.synonym",
  "NAFDAC",
  "form.name",
  "route.name",
  "strength",
  "applicant.name",
  "approval_date",
  "status",
];

// The shape of one product in the response (only the fields we plan to use).
export interface RawProduct {
  product_id: number;
  product_name: string;
  NAFDAC: string;
  strength: string;
  status: string;
  approval_date: string;
  expiry_date: string;
  pack_size: string;
  composition: string;
  atc: string;
  smpc: string;
  category_name: string;
  ingredient_name: string;
  synonym: string;
  form_name: string;
  route_name: string;
  applicant_name: string;
  manufacturer_id: number;
}

export interface GreenbookResponse {
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
  data: RawProduct[];
  error?: string;
}

// Rebuilds the same query string the browser sends.
export function buildParams(start: number, length: number): URLSearchParams {
  const params = new URLSearchParams();
  params.set("draw", "1");

  COLUMNS.forEach((column, i) => {
    params.set(`columns[${i}][data]`, column);
    params.set(`columns[${i}][name]`, column);
    params.set(`columns[${i}][searchable]`, "true");
    params.set(
      `columns[${i}][orderable]`,
      column === "product_category.name" ? "false" : "true",
    );
    params.set(`columns[${i}][search][value]`, "");
    params.set(`columns[${i}][search][regex]`, "false");
  });

  params.set("order[0][column]", "0");
  params.set("order[0][dir]", "asc");
  params.set("start", String(start));
  params.set("length", String(length));
  params.set("search[value]", "");
  params.set("search[regex]", "false");
  params.set("search_ingredient", "");
  params.set("_", String(Date.now()));

  return params;
}

// Fetches one page of products.
export async function fetchPage(
  start: number,
  length: number,
): Promise<GreenbookResponse> {
  const url = `${BASE_URL}?${buildParams(start, length).toString()}`;

  const response = await fetch(url, {
    headers: {
      // This header tells the server "send me the JSON, not the HTML page".
      "X-Requested-With": "XMLHttpRequest",
      Accept: "application/json",
      // Say who we are. Polite scrapers identify themselves.
      "User-Agent": "CheckAm-NG student project (Talenvo residency)",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status} ${response.statusText}`,
    );
  }

  const json = (await response.json()) as GreenbookResponse;

  // The site can return 200 OK with an error message inside, so check for that too.
  if (json.error) {
    throw new Error(`Greenbook returned an error: ${json.error}`);
  }

  return json;
}
