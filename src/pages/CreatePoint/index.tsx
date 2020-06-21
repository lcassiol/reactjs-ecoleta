import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { Link, useHistory } from "react-router-dom";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { FiArrowLeft } from "react-icons/fi";

import { Map, TileLayer, Marker } from "react-leaflet";
import { LeafletMouseEvent } from "leaflet";

import api from "../../services/api";
import Dropzone from "../../components/Dropzone";
import "./styles.css";

import logo from "../../assets/logo.svg";

interface ItemProps {
  id: number;
  title: string;
  image_url: string;
}

interface IBGEUFResponse {
  sigla: string;
}

interface IBGECityresponse {
  nome: string;
}

const CreatePoint = () => {
  let schema = Yup.object().shape({
    name: Yup.string().required("Nome é um campo obrigatório"),
    email: Yup.string()
      .email("Digite um email válido")
      .required("Email deve estar preenchido"),
    whatsapp: Yup.string().required("Whatsapp é um campo obrigatório"),
    city: Yup.string().required("Cidade deve estar preenchida"),
    uf: Yup.string().required("Uf deve estar preenchido").max(2),
    latitude: Yup.number().required(),
    longitude: Yup.number().required(),
    items: Yup.array()
      .of(Yup.number())
      .required("Algum item deve ser selecionado"),
  });

  const history = useHistory();
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [items, setItems] = useState<ItemProps[]>([]);
  const [ufs, setUFs] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [initialPosition, setInitialPosition] = useState<[number, number]>([
    -8.0988934,
    -34.8852371,
  ]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
  });
  const [selectedUF, setSelectedUf] = useState("0");
  const [selectedCity, setSelectedCity] = useState("0");
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([
    0,
    0,
  ]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedFile, setSelectedFile] = useState<File>();

  useEffect(() => {
    async function getItems() {
      const { data } = await api.get("/items");

      setItems(data);
    }

    getItems();
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;

      setInitialPosition([latitude, longitude]);
    });
  }, []);

  useEffect(() => {
    async function getUfs() {
      const { data } = await api.get<IBGEUFResponse[]>(
        "https://servicodados.ibge.gov.br/api/v1/localidades/estados/"
      );
      const ufInifials = data.map((uf) => uf.sigla);

      setUFs(ufInifials);
    }

    getUfs();
  }, []);

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setFormData({ ...formData, [name]: value });
  }

  function handleMapClick(event: LeafletMouseEvent) {
    const latlong = event.latlng;
    setSelectedPosition([latlong.lat, latlong.lng]);
  }

  function handleSelectUF(event: ChangeEvent<HTMLSelectElement>) {
    const uf = event.target.value;
    setSelectedUf(uf);
  }

  function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
    const city = event.target.value;
    setSelectedCity(city);
  }

  function handleSelectItem(id: number) {
    const alreadySelected = selectedItems.findIndex((item) => item === id);

    if (alreadySelected >= 0) {
      const filteredItems = selectedItems.filter((item) => item !== id);

      setSelectedItems(filteredItems);
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const { name, email, whatsapp } = formData;
    const uf = selectedUF;
    const city = selectedCity;
    const [latitude, longitude] = selectedPosition;
    const items = selectedItems;

    try {
      await schema.validate(
        {
          name,
          email,
          whatsapp,
          uf,
          city,
          latitude,
          longitude,
          items,
        },
        { abortEarly: false }
      );
    } catch (err) {
      console.log(err);
      //TO DO adicionar os erros para aparecerem na pagina
      if (err instanceof Yup.ValidationError) {
        const errorMessages: string[] = [];

        err.inner.forEach((error) => {
          errorMessages[error.path] = error.message;
        });

        setFormErrors(errorMessages);
      }

      toast("Erro no cadastro, verifique os campos digitados", {
        type: "error",
      });
      return;
    }

    const data = new FormData();
    data.append("name", name);
    data.append("email", email);
    data.append("whatsapp", whatsapp);
    data.append("uf", uf);
    data.append("city", city);
    data.append("latitude", String(latitude));
    data.append("longitude", String(longitude));
    data.append("items", items.join(","));

    if (selectedFile) {
      data.append("image", selectedFile);
    }

    await api.post("points", data);

    toast("Ponto cadastrado com sucesso!", {
      type: "success",
    });

    history.push("/");
  }

  useEffect(() => {
    async function getCities() {
      if (selectedUF === "0") {
        return;
      }

      const { data } = await api.get<IBGECityresponse[]>(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/municipios`
      );

      const cityNames = data.map((city) => city.nome);

      setCities(cityNames);
    }

    getCities();
  }, [selectedUF]);

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta" />

        <Link to="/">
          <FiArrowLeft />
          Voltar para home
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>
          Cadastro do <br />
          ponto de coleta
        </h1>

        <Dropzone onFileUploaded={setSelectedFile} />

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input
              type="text"
              name="name"
              id="name"
              onChange={handleInputChange}
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                type="email"
                name="email"
                id="email"
                onChange={handleInputChange}
              />
            </div>

            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input
                type="text"
                name="whatsapp"
                id="whatsapp"
                maxLength={11}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMaps</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={selectedPosition} />
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select
                onChange={handleSelectUF}
                name="uf"
                value={selectedUF}
                id="uf"
              >
                <option value="0">Selecione uma UF</option>
                {ufs.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select
                name="city"
                id="city"
                value={selectedCity}
                onChange={handleSelectCity}
              >
                <option value="0">Selecione uma cidade</option>
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Ítens de coleta</h2>
            <span>Selecione um ou mais itens abaixo</span>
          </legend>

          <ul className="items-grid">
            {items.map((item) => (
              <li
                key={item.id}
                onClick={() => handleSelectItem(item.id)}
                className={selectedItems.includes(item.id) ? "selected" : ""}
              >
                <img src={item.image_url} alt={item.title} />
                <span>{item.title}</span>
              </li>
            ))}
          </ul>
        </fieldset>

        <button type="submit">Cadastrar ponto de coleta</button>
      </form>
    </div>
  );
};

export default CreatePoint;
