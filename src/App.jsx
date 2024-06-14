import { useEffect, useState } from 'react'
import './App.css'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation
} from "react-router-dom";
function App() {
  const [wines, setWines] = useState([]);
  const [loadingWines, setLoadingWines] = useState(true);
  const read_wine_db = () => {
    console.log("Read wine db")
    fetch(`${import.meta.env.VITE_APP_API_URL}/wines`)
      .then((response) => response.json())
      .then((data) => {
        setWines(data);
        console.log(data);
        setLoadingWines(false);
      });
  }
  useEffect(() => {
    document.title = 'Got Any Grapes';
  }, []);
  const [navigation_timeout, setNavigationTimeout] = useState(null);

  const search_wines = (query_params) => {
    let query_string = '';
    for (const [key, value] of Object.entries(query_params)) {
      query_string += `${key}=${value}&`;
    }
    fetch(`${import.meta.env.VITE_APP_API_URL}/search_wines?${query_string}`)
      .then((response) => response.json())
      .then((data) => {
        setWines(data);
        console.log(data);
      });
  }


  return (
    <Router>
      <nav style={{ margin: 10, position: 'absolute', top: 0, left: 0 }}>
        <Link to="/" style={{ padding: 5 }}>
          Home
        </Link>
        <Link to="/find" style={{ padding: 5 }}>
          Find Wines
        </Link>
        <Link to="/servers" style={{ padding: 5 }}>
          Take Wine Home
        </Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home search_wines={search_wines} read_wine_db={read_wine_db} wines={wines} loadingWines={loadingWines} />} />
        <Route path="/find" element={<AddWines setNavigationTimeout={setNavigationTimeout} navigation_timeout={navigation_timeout} />} />
        <Route path="/servers" element={<Servers search_wines={search_wines}  read_wine_db={read_wine_db} wines={wines} loadingWines={loadingWines} />} />
        <Route path="*" element={<NoMatch />} />
      </Routes>
    </Router >
  );
}

function Home(props) {
  const location = useLocation();
  useEffect(() => {
    props.read_wine_db();
  }, [location])

  return (
    <div className="Page">
      <h1>Your Wine List</h1>
      <WineDataGrid search_wines={props.search_wines} location={location} wines={props.wines} loadingWines={props.loadingWines} />
    </div>
  )
}

function AddWines(props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [inputText, setInputText] = useState('');
  const [found_wines, setFoundWines] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showAddWineModal, setShowAddWineModal] = useState(false);
  const [selectedWine, setSelectedWine] = useState({});
  const [searchAttempted, setSearchAttempted] = useState(false);

  useEffect(() => {
    return () => {
      clearTimeout(props.navigation_timeout);
    }
  }, [])

  useEffect(() =>{
    if (props.navigation_timeout != null) {
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
    setInputText('');
    setFoundWines([]);
    setSearching(false);
    setShowAddWineModal(false);
    setSelectedWine({});
    setSearchAttempted(false);
  }, [location])

  const find_wine = (search_query) => {
    setSearching(true);
    // This uses the endpoint /search_wine_web?query=<search_query>, and returns the results as one wine object
    console.log("Searching for wines with query: " + search_query)
    fetch(`${import.meta.env.VITE_APP_API_URL}/search_wine_web?query=${search_query}`)
      .then((response) => response.json())
      .then((data) => {
        setFoundWines(data.results);
        console.log(data.results);
        setSearching(false);
        setSearchAttempted(true);
      });
  }

  const add_wine = (wine) => {
    fetch(`${import.meta.env.VITE_APP_API_URL}/add_wine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(wine)
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        props.setNavigationTimeout(setTimeout(() => {
          navigate('/');
        }
          , 2000));
      }
      );
  }

  return (
    <div className="Page"><h1>Find Wines</h1>
      {props.navigation_timeout == null && <><input type="text" id="search" name="search" value={inputText}
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            find_wine(inputText);
          }
        }}
        onChange={(e) => setInputText(e.target.value)}></input>
        <br />
        <br />
        <button
          onClick={() => find_wine(inputText)}
        >
          Search
        </button></>}
      {found_wines.length > 0 && !searching && props.navigation_timeout == null &&
        <>
          <h2>Results</h2>
          {found_wines.map((wine) => (
            <div key={wine.id}>
              <h3>{wine["name"]}</h3>
              <p>Producer: {wine["producer"]}</p>
              <p>Varietal: {wine["varietal"]}</p>
              <p>Vintage: {wine["vintage"]}</p>
              <p>Price: ${wine["price"]}</p>
              <p>Pack Sizes: {wine["pack_sizes"]}</p>
              <p>Notes: {wine["notes"]}</p>
              <button
                onClick={() => {
                  wine['date_tried'] = new Date().toISOString().split('T')[0];
                  setSelectedWine(wine);
                  setShowAddWineModal(true);
                }}>
                Add Wine
              </button>
            </div>
          ))}
        </>
      }
      {searching &&
        <p>Searching...</p>
      }
      {showAddWineModal && !props.navigation_timeout &&
        <div className="AddWineModal">
          <h2>Add Wine</h2>
          <p className="input-container">
            <label htmlFor="date_tried">Date Tried:</label>
            <input type="date" id="date_tried" value={(selectedWine["date_tried"])} onChange={(e) => {
              setSelectedWine({ ...selectedWine, date_tried: e.target.value });
            }} name="date_tried"></input>
          </p>

          <p className="input-container">
            <label htmlFor="producer">Producer:</label>
            <input type="text" id="producer" value={selectedWine["producer"]} onChange={(e) => { setSelectedWine({ ...selectedWine, producer: e.target.value }); }} name="producer"></input>
          </p>

          <p className="input-container">
            <label htmlFor="name">Name:</label>
            <input type="text" id="name" value={selectedWine["name"]} onChange={(e) => { setSelectedWine({ ...selectedWine, name: e.target.value }); }} name="name"></input>
          </p>

          <p className="input-container">
            <label htmlFor="varietal">Varietal:</label>
            <input type="text" id="varietal" value={selectedWine["varietal"]} onChange={(e) => { setSelectedWine({ ...selectedWine, varietal: e.target.value }); }} name="varietal"></input>
          </p>

          <p className="input-container">
            <label htmlFor="vintage">Vintage:</label>
            <input type="text" id="vintage" value={selectedWine["vintage"]} onChange={(e) => { setSelectedWine({ ...selectedWine, vintage: e.target.value }); }} name="vintage"></input>
          </p>

          <p className="input-container">
            <label htmlFor="price">Price:</label>
            <input type="text" id="price" value={selectedWine["price"]} onChange={(e) => { setSelectedWine({ ...selectedWine, price: e.target.value }); }} name="price"></input>
          </p>

          <p className="input-container">
            <label htmlFor="pack_sizes">Pack Sizes:</label>
            <input type="text" id="pack_sizes" value={selectedWine["pack_sizes"]} onChange={(e) => { setSelectedWine({ ...selectedWine, pack_sizes: e.target.value }); }} name="pack_sizes"></input>
          </p>

          <p className="input-container">
            <label htmlFor="notes">Notes:</label>
            <input type="text" id="notes" value={selectedWine["notes"]} onChange={(e) => { setSelectedWine({ ...selectedWine, notes: e.target.value }); }} name="notes"></input>
          </p>
          <br />
          <br />
          <br />
          <button
            onClick={() => {
              add_wine(selectedWine);
              setShowAddWineModal(false);
            }}
          >
            Add Wine
          </button>
        </div>}
      {props.navigation_timeout &&
        <>
          <h2>Wine Added</h2>
          <p>Going Home</p>
        </>
      }
      {searchAttempted && !searching && found_wines.length == 0 &&
        <p>No wines found</p>
      }
    </div>
  )
}

function Servers(props) {
  const location = useLocation();
  useEffect(() => {
    props.read_wine_db();
  }, [location])
  return (
    <>
      <h1>Take Wine Home</h1>
      <WineDataGrid search_wines={props.search_wines} location={location} wines={props.wines} loadingWines={props.loadingWines} />
    </>
  )
}

function WineDataGrid(props) {
  return (
    <div className="WineDataGrid">
      {!props.loadingWines &&
        <div className="SortAndFilterMethods">
          <p className="input-container">
            <label htmlFor="name">Name:</label>
            <input type="text" id="name" name="name" onChange={(e) => props.search_wines({ name: e.target.value })}></input>
          </p>
          <p className="input-container">
            <label htmlFor="producer">Producer:</label>
            <input type="text" id="producer" name="producer" onChange={(e) => props.search_wines({ producer: e.target.value })}></input>
          </p>

          <p className="input-container">
            <label htmlFor="varietal">Varietal:</label>
            <input type="text" id="varietal" name="varietal" onChange={(e) => props.search_wines({ varietal: e.target.value })}></input>
          </p>

          <p className="input-container">
            <label htmlFor="vintage">Vintage:</label>
            <input type="text" id="vintage" name="vintage" onChange={(e) => props.search_wines({ vintage: e.target.value })}></input>
          </p>
          <br />
          <br />
          <br />
          <br />
        </div>
      }
      {!props.loadingWines && props.wines.length > 0 &&
        <table className="WineDataGridTable">
          <WineGridHeader location={props.location} />
          <tbody>
            {props.wines.length > 0 && props.wines.map((wine, index) => (
              console.log(index),
              <WineGridItem location={props.location} index={index} key={index} wine={wine} />
            ))}
          </tbody>
        </table>
      }
      {!props.loadingWines && props.wines.length == 0 &&
        <p>No wines found</p>
      }
    </div>
  )
}

function WineGridHeader(props) {
  if (props.location.pathname == '/servers') {
    return (
      <thead className="WineGridHeader">
        <tr>
          <th>Producer</th>
          <th>Name</th>
          <th>Varietal</th>
          <th>Vintage</th>
          <th>Price</th>
        </tr>
      </thead>
    )
  }
  return (
    <thead className="WineGridHeader">
      <tr>
        <th>Try Date</th>
        <th>Producer</th>
        <th>Name</th>
        <th>Varietal</th>
        <th>Vintage</th>
        <th>Price</th>
        <th>Pack Sizes</th>
        <th>Notes</th>
      </tr>
    </thead>
  )
}

function WineGridItem(props) {
  if (props.location.pathname == '/servers') {
    return (
      <tr className="WineGridItem" tabindex={0}>
        <td>{props.wine["producer"]}</td>
        <td>{props.wine["name"]}</td>
        <td>{props.wine["varietal"]}</td>
        <td>{props.wine["vintage"]}</td>
        <td>${props.wine["price"]}</td>
        <WineGridItemControls location={props.location} />
      </tr>
    )
  }
  return (
    <tr className="WineGridItem" tabindex={0}>
      <td>{props.wine["date_tried"]}</td>
      <td>{props.wine["producer"]}</td>
      <td>{props.wine["name"]}</td>
      <td>{props.wine["varietal"]}</td>
      <td>{props.wine["vintage"]}</td>
      <td>${props.wine["price"]}</td>
      <td>{props.wine["pack_sizes"]}</td>
      <td>{props.wine["notes"]}</td>
      <WineGridItemControls location={props.location} />
    </tr>
  )
}

function WineGridItemControls(props) {
  if (props.location.pathname == '/servers') {
    return (
      <div className="WineGridItemControls">
        <button tabindex={-1}>Buy</button>
      </div>
    )
  }
  return (
    <div className="WineGridItemControls">
      <button tabindex={-1}>Edit</button>
      <button tabindex={-1}>Delete</button>
    </div>
  )
}

function NoMatch() {
  return <h2>Nothing to See Here</h2>;
}

export default App
