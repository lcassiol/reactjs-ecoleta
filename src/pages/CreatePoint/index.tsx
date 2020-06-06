import React, { useEffect, useState, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

import { Map, TileLayer, Marker } from "react-leaflet";

import api from "../../services/api";
import "./styles.css";

import logo from "../../assets/logo.svg";

interface ItemProps {
  id: string;
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
  const [items, setItems] = useState<ItemProps[]>([]);
  const [ufs, setUFs] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [selectedUF, setSelectedUf] = useState("0");
  const [selectedCity, setSelectedCity] = useState("0");

  useEffect(() => {
    async function getItems() {
      const { data } = await api.get("/items");

      setItems(data);
    }

    getItems();
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

  function handleSelectUF(event: ChangeEvent<HTMLSelectElement>) {
    const uf = event.target.value;
    setSelectedUf(uf);
  }

  function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
    const city = event.target.value;
    setSelectedCity(city);
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

      <form action="">
        <h1>
          Cadastro do <br />
          ponto de coleta
        </h1>

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input type="text" name="name" id="name" />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input type="email" name="email" id="email" />
            </div>

            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input type="text" name="whatsapp" id="whatsapp" />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          <Map center={[-27.2092052, -49.6401092]} zoom={15}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMaps</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={[-27.2092052, -49.6401092]} />
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
              <li key={item.id}>
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
