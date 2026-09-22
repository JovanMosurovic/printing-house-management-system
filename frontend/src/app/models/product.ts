export type SortDirection = "asc" | "desc";

export class PrintingServiceModel {
  idUsluge = "";
  tipStampe = "";
  dodatnaCenaPoKomadu = 0;
  maxSirinaMm = 0;
  maxVisinaMm = 0;
}

export class ProductCommentModel {
  _id = "";
  clientId = "";
  username = "";
  text = "";
  createdAt = "";
}

export class ProductModel {
  _id = "";
  stamparijaId = "";
  nazivStamparije = "";
  adresaStamparije = "";
  grad = "";

  sifra = "";
  naziv = "";
  opis = "";
  kategorija = "";
  potkategorija = "";

  jedinicnaCena = 0;
  kolicinaNaLageru = 0;

  dostupneBoje: string[] = [];
  slikaUrl = "";
  dodatneSlike: string[] = [];
  uslugeStampe: PrintingServiceModel[] = [];

  brojSvidjanja = 0;
  brojNesvidjanja = 0;
  comments: ProductCommentModel[] = [];
}

export class HomepageDataModel {
  brojStamparija = 0;
  kategorije: string[] = [];
  topProizvodi: ProductModel[] = [];
}

export class ProductSearchModel {
  naziv = "";
  kategorija = "";
  sortDirection: SortDirection = "asc";
}
