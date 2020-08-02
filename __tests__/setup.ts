import axios from "axios";
jest.mock("axios");
axios.create = jest.fn().mockReturnValue(axios);