module.exports = () => {
  const faker = require("faker");
  const _ = require("lodash");

  const liczebnoscKomisji = faker.random.number({min: 3, max: 5});
  const noty = [10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5, 18, 18.5, 19, 19.5, 20];
  const masciM = ["siwy","gniady","kaszt.","sk.gn.","kary"];
  const masciZ = ["siwa","gniada","kaszt.","sk.gn.","kara"];
  const aktualnyRok = new Date().getFullYear();
  const czempRocznych = faker.random.boolean();
  const kategorie = [
    ["roczne", {min: 1, max: 1}],
    ["dwuletnie", {min:2, max: 2}],
    ["trzyletnie", {min: 3, max: 3}],
    ["młodsze", {min: 4, max: 6}],
    ["starsze", {min: 7, max: 21}]
  ];

  const klasy = (() => {
    let liczbaKlas = 0;
    let klasy = [];
    for (kat of kategorie) {
      let lk1 = faker.random.number({min: 1, max: 3});
      let lk2 = faker.random.number({min: 1, max: 3});
      for (let k = 1; k <= lk1; k += 1) {
        klasy.push({kl: liczbaKlas + k, kat: kat[0], pl: "klacze", min: kat[1].min, max: kat[1].max})
      }
      liczbaKlas += lk1;
      for (let k = 1; k <= lk2; k += 1) {
        klasy.push({kl: liczbaKlas + k, kat: kat[0], pl: "ogiery", min: kat[1].min, max: kat[1].max})
      }
      liczbaKlas += lk2;
    }
    let klasyCzempionatowe = new Map([]);
    if (czempRocznych) {
      liczbaKlas += 1;
      klasy.push({kl: liczbaKlas, kat: "roczne – czempionat", pl: "klacze"});
      klasyCzempionatowe.set("klacze roczne", liczbaKlas);
      liczbaKlas += 1;
      klasy.push({kl: liczbaKlas, kat: "roczne – czempionat", pl: "ogiery"});
      klasyCzempionatowe.set("ogiery roczne", liczbaKlas);
    }
    liczbaKlas += 1;
    klasy.push({kl: liczbaKlas, kat: "młodsze – czempionat", pl: "klacze"});
    klasyCzempionatowe.set("klacze młodsze", liczbaKlas);
    liczbaKlas += 1;
    klasy.push({kl: liczbaKlas, kat: "młodsze – czempionat", pl: "ogiery"});
    klasyCzempionatowe.set("ogiery młodsze", liczbaKlas);
    liczbaKlas += 1;
    klasy.push({kl: liczbaKlas, kat: "starsze – czempionat", pl: "klacze"});
    klasyCzempionatowe.set("klacze starsze", liczbaKlas);
    liczbaKlas += 1;
    klasy.push({kl: liczbaKlas, kat: "starsze – czempionat", pl: "ogiery"});
    klasyCzempionatowe.set("ogiery starsze", liczbaKlas);
      klasy.forEach((kl, idx) => {
        if (kl.pl === "klacze") {
            if (kl.kat === "starsze") {
                klasy[idx].czempionat = klasyCzempionatowe.get("klacze starsze");
            } else if (kl.kat === "roczne") {
                klasy[idx].czempionat = klasyCzempionatowe.get(czempRocznych ? "klacze roczne" : "klacze młodsze");
            } else if (kl.kat === "młodsze") {
                klasy[idx].czempionat = klasyCzempionatowe.get("klacze młodsze");
            }
        } else {
            if (kl.kat === "starsze") {
                klasy[idx].czempionat = klasyCzempionatowe.get("ogiery starsze");
            } else if (kl.kat === "roczne") {
                klasy[idx].czempionat = klasyCzempionatowe.get(czempRocznych ? "ogiery roczne" : "ogiery młodsze");
            } else if (kl.kat === "młodsze") {
                klasy[idx].czempionat = klasyCzempionatowe.get("ogiery młodsze");
            }
        }
      })
    return klasy;
  })();

  const liczebnoscKlas = (() => {
    let info = {
      total: 0,
      breaks: []
    };
    let tot = klasy.length - (czempRocznych ? 3 : 2);
    for (let cno = 1; cno <= tot; cno += 1) {
      let n = faker.random.number({min: 7, max: 17})
      info.total += n;
      info.breaks.push(info.total)
    }
    return info;
  })();

  const numerKlasy = (nr) => {
    let idx = 0;
    while (nr > liczebnoscKlas.breaks[idx]) { idx += 1 }
    return idx + 1;
  }

  const sedziowie = _.times(liczebnoscKomisji + 2, (nr) => {
      return {
        id: nr + 1,
        sedzia: faker.name.findName(),
        kraj: faker.address.countryCode()
      }
  });

  return {
    sedziowie: sedziowie,
    klasy: _.times(klasy.length, (nr) => {
      let kl = {
        id: nr + 1,
	numer: nr + 1,
        kat: `${klasy[nr].pl} ${klasy[nr].kat}`,
      };
      if (klasy[nr].czempionat) {
        kl.czempionat = klasy[nr].czempionat;
        kl.komisja = _.times(liczebnoscKomisji, (s) => {
          return (s + nr) % (liczebnoscKomisji + 1) + 1;
        })
      } else {
        kl.komisja = _.times(sedziowie.length, (s) => {
          return s + 1;
        })
      }
      return kl;
    }),
    konie: _.times(liczebnoscKlas.total, (n) => {
      let klasa = numerKlasy(n + 1);
      let plec = klasy[klasa - 1].pl;
      let conf = {min: klasy[klasa - 1].min, max: klasy[klasa - 1].max};
      let rocznikInc = faker.random.number(conf);
      return {
        "id": n + 1,
	"numer": n + 1,
        "klasa": klasa,
        "nazwa": faker.name.firstName(),
        "kraj": faker.address.countryCode(),
        "rocznik": aktualnyRok - rocznikInc,
        "masc": (plec == "klacze" ? faker.random.arrayElement(masciZ) : faker.random.arrayElement(masciM)),
        "plec": (plec == "klacze" ? "kl." : "og."),
        "hodowca": {
            "nazwa": faker.name.findName(),
            "kraj": faker.address.countryCode()
        },
        "wlasciciel": {
            "nazwa": faker.name.findName(),
            "kraj": faker.address.countryCode()
        },
        "rodowod": {
            "o": {
                "nazwa": faker.name.firstName(),
                "kraj": faker.address.countryCode()
            },
            "m": {
                "nazwa": faker.name.firstName(),
                "kraj": faker.address.countryCode()
            },
            "om": {
                "nazwa": faker.name.firstName(),
                "kraj": faker.address.countryCode()
            }
        },
        wynik: {
          noty: _.times(liczebnoscKomisji, (n) => {
            return {
                "typ": faker.random.arrayElement(noty),
                "glowa": faker.random.arrayElement(noty),
                "kloda": faker.random.arrayElement(noty),
                "nogi": faker.random.arrayElement(noty),
                "ruch": faker.random.arrayElement(noty)
            }
          })
        }

      }
    })
  }
}
