// Set up axios correctly for jest tests
import axios from "axios";
jest.mock("axios");
axios.create = jest.fn().mockReturnValue(axios);