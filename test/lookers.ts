import { LookerManager } from "../src/looker-manager";
import Axios from "axios";
import Dotenv from "dotenv";
import { Profile } from "../src/types/profile.type";
Dotenv.config({ quiet: true });

if (process.argv.length != 3) {
	throw new Error("User not specified");
}

const user = process.argv[2];
const token = process.env.NAMETAG_TOKEN;
if (!token) {
	throw new Error("Namet.ag token not specified");
}

const lookerManager = new LookerManager();
lookerManager.onready = () =>
	Axios.get<Profile>(`https://api.namet.ag/users/${user}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
		.then(({ data }) => {
			console.log(data);
			lookerManager.lookup(data, (capes) => console.log(capes));
		})
		.catch(console.error);
