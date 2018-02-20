const { Client } = require('pg');
const client = new Client({
	host: 'localhost',
	port: 5432,
	user: 'pi',
	password: 'raspberry',
	database: 'poe_ladder_data'
});


const class_list = [
	"Slayer",
	"Gladiator",
	"Champion",
	
	"Assassin",
	"Saboteur",
	"Trickster",
	
	"Juggernaut",
	"Berserker",
	"Chieftain",
	
	"Necromancer",
	"Elementalist",
	"Occultist",
	
	"Deadeye",
	"Raider",
	"Pathfinder",
	
	"Ascendant"
];

async function get_items(character_name, account_name, support) {
	var retval = [];
	var result_2 = await client.query(`select * from poe_character_items where character = '${character_name}' and account = '${account_name}'`);
	if(result_2.rows[0]) {
		if(result_2.rows[0].items != 0)
		{
			var items = result_2.rows[0].items.items;
			for(var j = 0; j < items.length; j++) {
				if(items[j].socketedItems) {
					for(var k = 0; k < items[j].socketedItems.length; k++) {
						if(items[j].socketedItems[k].support === support) {
							//console.log(" " + items[j].socketedItems[k].typeLine);
							retval.push(items[j].socketedItems[k].typeLine);
						}
					}
				}
			}
		}
	}
	return retval;
}

client.connect();

exports.body = async function(req, res) {
	
	var start, end, league, char_class;
	
	var char_name = "";
	var account_name = "";
	var search_skill = "";
	
	var filter_accounts = [];
	var filter_characters = [];
	var filter = false;
	
	if(parseInt(req.query.start)) {
		if(parseInt(req.query.start) < 15000 )
		{
			start = parseInt(req.query.start);
		}
		else
		{
			start = 15000;
		}
		if(parseInt(req.query.start) < 10 )
		{
			start = 0;
		}
	}
	else {
		start = 0;
	}
	
	if(req.query.league) {
		league = req.query.league;
	}
	else {
		league = 'Abyss';
	}
	
	if(req.query.char_class) {
		char_class = req.query.char_class;
	}
	else {
		char_class = 'All';
	}
	
	if(req.query.char_name) {
		char_name = req.query.char_name;
	}
	
	if(req.query.account_name) {
		account_name = req.query.account_name;
	}
	
	if(req.query.search_skill) {
		filter = true;
		search_skill = req.query.search_skill;
		var result = await client.query(`select * from poe_character_items where items @> ` +
										`'{"items": [{ "socketedItems": [{"typeLine": "${search_skill}"}]}]}'`);
		for(var i = 0; i < result.rows.length; i++) {
			//console.log(result.rows[i].account, ":", result.rows[i].character);
			filter_accounts.push(result.rows[i].account);
			filter_characters.push(result.rows[i].character);
		}
		
	}
	
	end = parseInt(start + 9);
				
	
	var searchStr = `select * from poe_ladder_data where (league = '${league}' `; 
	
	if(char_class !== 'All') {
		searchStr += ` and class = '${char_class}' `;
	}
	
	if(char_name !== "") {
		searchStr += ` and name = '${char_name}' `;
	}
	
	if(account_name !== "") {
		searchStr += ` and account_name = '${account_name}' `;
	}
	
	if(filter && (filter_accounts.length > 0)) {
		// select * from poe_ladder_data where account_name in ('TheTzn', 'cooltail') order by (_id);
		//searchStr += `where account_name in ('TheTzn', 'cooltail') and where name in ('TheTzn', 'cooltail')`;
		//console.log(filter_accounts);
		searchStr += ` and (`;
		for(var i = 0; i < filter_accounts.length; i++) {
			if(i > 0) 
				searchStr += ` or account_name = '${filter_accounts[i]}' `;
			else
				searchStr += ` account_name = '${filter_accounts[i]}' `;
				
		}
		
		searchStr += `) and (`;
		for(var i = 0; i < filter_characters.length; i++) {
			if(i > 0) 
				searchStr += ` or name = '${filter_characters[i]}' `;
			else
				searchStr += ` name = '${filter_characters[i]}' `;
				
		}
		searchStr += `)`;
		//console.log(filter_characters);
	}
	
	searchStr += ` ) order by _id limit 10 offset ${start}`;
	
	//console.log(searchStr);
	
	var result;
	
	if(!(filter && (filter_accounts.length == 0))) {
		// don't search. if the filter didn't get any results.
		result = await client.query(searchStr);	
	}
	
	//console.log(result.rows[0]._id);

	var leagues = await client.query(`select * from poe_leagues`);
	var league_list = [];
	for(var i = 0; i < leagues.rows.length; i++)
	{
		league_list.push(leagues.rows[i].league_name);
	}
	
	var keywords = [];
	// Get Keywords
	for(var i = 0; i < result.rows.length; i++) {
		//console.log(result.rows[i].name, ":", result.rows[i].account_name);
		var res_keywords = await get_items(result.rows[i].name, result.rows[i].account_name, false);
		//console.log(a)
		keywords.push(res_keywords);
	}

	//console.log(keywords);
			
	res.render("index", {start: start, league: league, char_class: char_class, data: result.rows, char_name: char_name, account_name: account_name,
							classes: class_list, leagues: league_list, search_skill: search_skill, keywords: keywords});
}