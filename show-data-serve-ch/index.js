module.exports = () => {
    const faker = require("faker");
    const _ = require("lodash");

    const liczebnoscKomisji = faker.random.number({min: 3, max: 5});
    const noty = [10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5, 18, 18.5, 19, 19.5, 20];
    const coloriM = ["siwy", "gniady", "kaszt.", "sk.gn.", "kary"];
    const coloriZ = ["siwa", "gniada", "kaszt.", "sk.gn.", "kara"];
    const aktualnyRok = new Date().getFullYear();
    const categoryegorie = [
        ["roczne", {min: 1, max: 1}],
        ["dwuletnie", {min: 2, max: 2}],
        ["trzyletnie", {min: 3, max: 3}],
        ["młodsze", {min: 4, max: 6}],
        ["starsze", {min: 7, max: 21}]
    ];

    const ranks = (() => {
        let liczbaKlas = 0;
        let ranks = [];
        for (category of categoryegorie) {
            let lk1 = faker.random.number({min: 1, max: 3});
            let lk2 = faker.random.number({min: 1, max: 3});
            for (let k = 1; k <= lk1; k += 1) {
                ranks.push({
                    kl: liczbaKlas + k,
                    category: category[0],
                    pl: "klacze",
                    min: category[1].min,
                    max: category[1].max
                })
            }
            liczbaKlas += lk1;
            for (let k = 1; k <= lk2; k += 1) {
                ranks.push({
                    kl: liczbaKlas + k,
                    category: category[0],
                    pl: "ogiery",
                    min: category[1].min,
                    max: category[1].max
                })
            }
            liczbaKlas += lk2;
        }
        return ranks;
    })();

    const liczebnoscKlas = (() => {
        let info = {
            total: 0,
            breaks: []
        };
        for (let cno = 1; cno <= ranks.length; cno += 1) {
            let n = faker.random.number({min: 7, max: 17})
            info.total += n;
            info.breaks.push(info.total)
        }
        return info;
    })();

    const numberranks = (nr) => {
        let idx = 0;
        while (nr > liczebnoscKlas.breaks[idx]) {
            idx += 1
        }
        return idx + 1;
    }

    const judges = _.times(liczebnoscKomisji + 2, (nr) => {
        return {
            id: nr + 1,
            name: faker.name.findName(),
            country: faker.address.countryCode()
        }
    });

    return {
        judges: judges,
        ranks: _.times(ranks.length, (nr) => {
            return {
                id: nr + 1,
                number: nr + 1,
                category: `${ranks[nr].pl} ${ranks[nr].category}`,
                committee: _.times(liczebnoscKomisji, (s) => {
                    return (s + nr) % (liczebnoscKomisji + 1) + 1;
                })
            }
        }),
        horses: _.times(liczebnoscKlas.total, (n) => {
            let rank = numberranks(n + 1);
            let sex = ranks[rank - 1].pl;
            let conf = {min: ranks[rank - 1].min, max: ranks[rank - 1].max};
            let ageInc = faker.random.number(conf);
            return {
                "id": n + 1,
                "number": n + 1,
                "rank": rank,
                "name": faker.name.firstName(),
                "country": faker.address.countryCode(),
                "yearOfBirth": aktualnyRok - ageInc,
                "color": (sex === "klacze" ? faker.random.arrayElement(coloriZ) : faker.random.arrayElement(coloriM)),
                "sex": (sex === "klacze" ? "kl." : "og."),
                "breeder": {
                    "name": faker.name.findName(),
                    "country": faker.address.countryCode()
                },
                "owner": {
                    "name": faker.name.findName(),
                    "country": faker.address.countryCode()
                },
                "lineage": {
                    "father": {
                        "name": faker.name.firstName(),
                        "country": faker.address.countryCode()
                    },
                    "mother": {
                        "name": faker.name.firstName(),
                        "country": faker.address.countryCode()
                    },
                    "mothersFather": {
                        "name": faker.name.firstName(),
                        "country": faker.address.countryCode()
                    }
                },
                notes: _.times(liczebnoscKomisji, (n) => {
                    return {
                        "type": faker.random.arrayElement(noty),
                        "head": faker.random.arrayElement(noty),
                        "log": faker.random.arrayElement(noty),
                        "legs": faker.random.arrayElement(noty),
                        "movement": faker.random.arrayElement(noty)
                    }
                })
            }
        })
    }
}
