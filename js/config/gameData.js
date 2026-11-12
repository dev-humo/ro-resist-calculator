/**
 * Datos del juego: objetos, cartas, resistencias y combos.
 * Para agregar contenido nuevo (cartas, armaduras, valis) se edita solo este archivo.
 */

export const gameData = {
  elements: ["Neutral", "Water", "Earth", "Fire", "Wind", "Poison", "Holy", "Shadow", "Ghost", "Undead"],

  resistances: {
    resist15: {
      "Orc Hero": "Neutral",
      "Garm": "Water",
      "Gopinich": "Earth",
      "Eddga": "Fire",
      "Mistress": "Wind",
      "Osiris": "Poison",
      "Pharaoh": "Undead",
      "Evil Snake Lord": "Ghost"
    },

    resist30: {
      "Raydric": "Neutral", "Orc Zombie": "Undead", "Myst": "Poison", "Marse": "Water",
      "Marionette": "Ghost", "Jakk": "Fire", "Isis": "Shadow", "Hode": "Earth", "Dustiness": "Wind",
      "Kareen": "Fire", "Satan MoRock": "Shadow", "Valkyrie Rock": "Neutral", "Evil GM": "Ghost",
      "Rift Walker": "Poison", "Sutur": "Earth", "Dark Priest": "Undead", "Snow Bunny": "Wind",
      "Kraken": "Water"
    },

    resist5: { "Anubis": "Holy", "Munak": "Earth" },

    armorReductions: {
      "Angeling": { Water: 25, Earth: 25, Fire: 25, Wind: 25, Poison: 25, Holy: 100, Shadow: -25 },
      "Argiope": { Poison: 100, Shadow: 50, Undead: 50 },
      "Bathory": { Poison: 50, Holy: -25, Shadow: 100, Ghost: 25, Undead: 100 },
      "Evil Druid": { Fire: -25, Poison: 125, Holy: -50, Shadow: 125, Undead: 100 },
      "Pasana": { Water: -50, Earth: 10, Fire: 75, Poison: -25 },
      "Sandman": { Earth: 75, Fire: -50, Wind: 10, Poison: -25 },
      "Swordfish": { Water: 75, Fire: 10, Wind: -75 },
      "Dokebi": { Water: 10, Earth: -50, Wind: 75, Poison: -25 },
      "Ghostring": { Neutral: 70, Ghost: -25, Undead: 50 }
    },

    resist10Armors: {
      "Mutant dragonoid": "Shadow",
      "Ungoliant": "Wind",
      "Zherlthsh": "Fire",
      "Archangeling": "Water",
      "Clock Tower Manager": "Neutral",
      "Hydrolancer": "Undead",
      "Chimera": "Earth",
      "Toad": "Poison",
      "Gemini": "Ghost"
    },

    customResistances: {
      "Permeter": { Shadow: 10 },
      "Assassin Cross": { Poison: 5, Shadow: 5 },
      "Maya Purple": { Wind: 5, Earth: 5 }
    },

    shieldResistances: {
      "Valkyrie": {
        Neutral: 10, Water: 10, Earth: 10, Fire: 10, Wind: 10,
        Poison: 10, Holy: 10, Shadow: 10, Ghost: 10, Undead: 10
      },
      "Supreme Guard": {}
    }
  },

  options: {
    hat: ["Evil Snake Lord", "Mistress", "Orc Hero", "Osiris", "Pharaoh", "Garm", "Eddga", "Gopinich", "Permeter", "Assassin Cross", "Maya Purple"],
    wings: ["Evil Snake Lord", "Mistress", "Orc Hero", "Osiris", "Pharaoh", "Garm", "Eddga", "Gopinich", "Permeter", "Assassin Cross", "Maya Purple"],
    mid: ["Evil Snake Lord", "Mistress", "Orc Hero", "Osiris", "Pharaoh", "Garm", "Eddga", "Gopinich", "Permeter", "Assassin Cross", "Maya Purple"],
    armor: {
      unique: ["Angeling", "Argiope", "Bathory", "Evil Druid", "Pasana", "Sandman", "Swordfish", "Dokebi", "Ghostring"],
      element: ["Mutant dragonoid", "Ungoliant", "Zherlthsh", "Archangeling", "Clock Tower Manager", "Hydrolancer", "Chimera", "Toad", "Gemini"],
      types: [
        "Earth Golden Lord Robe",
        "Venom Scruffy Coat",
        "Aqua Robe",
        "Blinded Brynhild",
        "Dark Diablo Armor",
        "Ghost Elite Armor",
        "Underworld Naga Armor",
        "Huracan Forest Robe",
        "Fire Crimson Robe",
        "Holy Divine Cloth"
      ]
    },
    valis: [
      "Raydric", "Orc Zombie", "Myst", "Marse", "Marionette", "Jakk", "Isis", "Hode", "Dustiness",
      "Kareen", "Satan MoRock", "Valkyrie Rock", "Evil GM", "Rift Walker", "Sutur", "Dark Priest", "Snow Bunny", "Kraken"
    ],
    shield: ["Anubis", "Munak", "Hardrock Mommoth", "Paladin", "Tirfing"],
    accessory: ["Clow", "Stalker", "Yoyo", "Vesper", "Bacsojin"],
    accessory2: ["Clow", "Stalker", "Yoyo", "Vesper", "Bacsojin"],
    shoes: ["Sprinting shoes Plus", "Variant Shoes V2 +10"]
  },

  // Cartas con bonos que no son resistencia elemental.
  // unique: solo 1 copia por ítem (grupo). Los bonos usan los ids de STAT_DEFS.
  cards: {
    "Hardrock Mommoth": { unique: true, stat: { resPhys: 15, resMedium: 5, def: 10 } },
    "Paladin":          { unique: true, stat: { resDemi: 15 } },
    "Tirfing":          { stat: { resMedium: 11, def: 2 } },
    "Clow":             { unique: true, stat: { resRange: 5 } },
    "Stalker":          { unique: true, stat: { flee: 25, perfectDodge: 5, resShort: 5 } },
    "Yoyo":             { stat: { perfectDodge: 5 } },
    "Vesper":           { unique: true, stat: { perfectDodge: 2 } },
    "Bacsojin":         { unique: true, stat: { resPhys: 3, resMisc: 3 } }
  },

  // Calzado. "Sprinting shoes Plus" da +5 de resistencia al elemento elegido (se calcula aparte).
  // "Variant Shoes V2 +10" supone el ítem a +10; al elegirlo se muestra `notes` en una nota flotante.
  shoes: {
    "Sprinting shoes Plus": {},
    "Variant Shoes V2 +10": {
      stat: { resPhys: 5, resMagic: 5 },
      notes: ["Debe estar a +10 para que den los bonus", "Resistencia a ataques físicos +5%", "Resistencia a ataques mágicos +5%"]
    }
  },

  // Combo elemental (Armor dual): el elemento del tipo de Armor coincide con el del Valis.
  // Holy no tiene combo. Solo comboBase y `stat` entran al cálculo; `notes` se muestra en la nota flotante.
  // Del texto original del juego se usa internamente solo DEF/MDEF +1 (punto 1); el resto
  // (STR/INT, refine, bonos de ATK/MATK, inmunidades) no se calcula ni se muestra.
  comboBase: { def: 1, mdef: 1 },
  combos: {
    Earth: {
      stat: { resSmall: 5, resMedium: 5 },
      notes: ["HP y SP +10%", "+20% de daño a mobs de elemento Earth", "\u22125% de daño recibido de mobs Small y Medium"]
    },
    Poison: {
      stat: {},
      notes: ["HP y SP +10%", "+20% de daño a mobs de elemento Poison", "Crítico +10", "Daño crítico +10%"]
    },
    Water: {
      stat: {},
      notes: ["HP y SP +10%", "+20% de daño a mobs de elemento Water", "Recuperas 1k de HP cada medio segundo y 50 de SP cada segundo"]
    },
    Neutral: {
      stat: {},
      notes: ["HP y SP +10%", "+20% de daño a mobs de elemento Neutral", "Hit +70"]
    },
    Shadow: {
      stat: {},
      notes: ["HP y SP +10%", "+20% de daño a mobs de elemento Shadow", "Daño en área de 2 celdas", "+15% de daño a mobs tipo Holy"]
    },
    Ghost: {
      stat: {},
      notes: ["HP y SP +10%", "+20% de daño a mobs de elemento Ghost", "5% de chance de quemar el 10% del daño causado como SP", "Recuperas 20 de SP por segundo"]
    },
    Undead: {
      stat: {},
      notes: ["HP y SP +10%", "+20% de daño a mobs de elemento Undead", "5% de chance de recuperar el 20% del daño causado como HP"]
    },
    Wind: {
      stat: {},
      notes: ["HP y SP +10%", "+20% de daño a mobs de elemento Wind", "Rango de ataque +3"]
    },
    Fire: {
      stat: {},
      notes: ["HP y SP +10%", "+20% de daño a mobs de elemento Fire", "+10% de daño a todas las razas"]
    }
  }
};

export const ARMOR_TYPE_ELEMENT = {
  "Earth Golden Lord Robe": "Earth",
  "Venom Scruffy Coat": "Poison",
  "Aqua Robe": "Water",
  "Blinded Brynhild": "Neutral",
  "Dark Diablo Armor": "Shadow",
  "Ghost Elite Armor": "Ghost",
  "Underworld Naga Armor": "Undead",
  "Huracan Forest Robe": "Wind",
  "Fire Crimson Robe": "Fire",
  "Holy Divine Cloth": "Holy"
};
