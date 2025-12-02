// fetch_all_pokemon_sprites.js
import fs from "fs";
import fetch from "node-fetch";
import cliProgress from "cli-progress";

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

// Fetch lista completa
const getAllPokemon = async () => {
    const all = [];
    let url = 'https://pokeapi.co/api/v2/pokemon?limit=2000&offset=0';
    // 2000 dovrebbe coprire tutti, ma puoi aumentare se nuovi pokemon vengono aggiunti

    while (url) {
        const res = await fetch(url);
        const data = await res.json();
        all.push(...data.results);
        url = data.next;
    }
    return all;
}

// Fetch singolo Pokémon
const fetchPokemon = async (pokemon) => {
    const res = await fetch(pokemon.url);
    const data = await res.json();
    return {
        id: data.id,
        name: data.name,
        sprite: data.sprites?.front_default || data.sprites?.["official-artwork"]?.front_default || data.sprites?.home?.front_default
    };
}

const main = async () => {
    const list = await getAllPokemon();
    console.log(`Trovati ${list.length} pokemon`);

    const pokemons = [];

    // Progress bar
    const bar = new cliProgress.SingleBar(
        {
            format: 'Scaricamento Pokémon |{bar}| {percentage}% | {value}/{total} | #{id} {name}',
            barCompleteChar: '#',
            barIncompleteChar: '.',
            hideCursor: true
        },
        cliProgress.Presets.shades_classic
    );

    bar.start(list.length, 0);

    for (const p of list) {
        try {
            const pfull = await fetchPokemon(p);
            pokemons.push(pfull);

            bar.update(pokemons.length, {
                id: pfull.id,
                name: pfull.name
            });

        } catch (e) {
            console.error('Errore fetching', p, e);
        }
    }

    // Creazione cartella di output
    const outputDir = "./pokemon/pokemon-files";
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    // Timestamp per evitare sovrascritture
    const now = new Date();
    const timestamp = now
        .toISOString()
        .replace(/[:.]/g, "-")
        .replace("T", "_")
        .split("Z")[0];

    // Percorsi dei file
    const csvPath = `${outputDir}/pokedex-data-${timestamp}.csv`;
    const mdPath = `${outputDir}/pokedex-data-${timestamp}.md`;

    // CSV
    const csv = ["id,Name,Icona,Sprite_url,Presente"];
    pokemons.forEach(p => csv.push(`${p.id},${capitalize(p.name)}, ,${p.sprite}`));
    fs.writeFileSync(csvPath, csv.join("\n"));

    // Markdown
    const md = ["| id | name | sprite |", "|---|---|---|"];
    pokemons.forEach(p => {
        const name = capitalize(p.name);
        md.push(`| ${p.id} | ${name} | ![${name}](${p.sprite}) |`);
    });
    fs.writeFileSync(mdPath, md.join("\n"));

    console.log(`Fatto — generati i file:\n- ${csvPath}\n- ${mdPath}`);
}

main();
// fetchPokemon(
//     {
//         "name": "zygarde-50",
//         "url": "https://pokeapi.co/api/v2/pokemon/718/"
//     }
// );
