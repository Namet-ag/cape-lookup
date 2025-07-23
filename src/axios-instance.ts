import Axios from "axios";

export default function getAxiosInstance() {
    return Axios.create({
        headers: {
            "User-Agent": "Namet.ag/2.0"
        }
    });
}