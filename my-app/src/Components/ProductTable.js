import { Container, Row, Col, Table, ToggleButton, Image, Card, ListGroup, InputGroup, FormControl, Form, Button, Spinner, Modal } from 'react-bootstrap';
import { PersonFill, GeoAltFill, Collection, Bag, Cash, Cart4 } from 'react-bootstrap-icons';
import { useState, useEffect, useRef } from 'react';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import "./ProductTable.css";
import API from '../API';
import { ProductList } from './EmployeeView'
import UserDropdown from "./CustomerSearchBar"
import WelcomeModal from './WelcomeModal'


function ProductTable(props) {

    const [productByFarmerList, setProductByFarmerList] = useState([]);
    const [productByFarmerListUpdated, setProductByFarmerListUpdated] = useState(true); 
    const [farmerListUpdated, setFarmerListUpdated] = useState(true); 
    const [farmerList, setFarmerList] = useState([]);
    const [update, setUpdate] = useState(true);
    const triggerUpdate = () => setUpdate(true);
    const [welcomeShow, setWelcomeShow] = useState(false);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        if (update === true) {
            setLoading(true);

            setProductByFarmerListUpdated(true);
            setFarmerListUpdated(true);

            API.getAllProductsByFarmers(props.timeMachine().toString())
                .then(productByFarmer => {
                    setProductByFarmerList(productByFarmer);
                    setProductByFarmerListUpdated(false);
                    setLoading(false);
                }).catch(pbf => console.log(pbf));

            API.getFarmer()
                .then(farmer => {
                    setFarmerList(farmer);
                    setFarmerListUpdated(false);
                }).catch(f => console.log(f));
            setUpdate(false);
        }
    }, [update]);

    useEffect(() => {
        if (props.reloadTime)
            setUpdate(true);
    }, [props.reloadTime])

    useEffect(() => {
        if (!props.isLoggedIn)
            setWelcomeShow(true);
        else
            setWelcomeShow(false);
        props.setSideShow(false);
    }, [props.isLoggedIn]);

    return (<>
        {loading ? <> <Row className="justify-content-center mt-5">
            < Spinner animation="border" size="xl" variant="secondary" />
        </Row > </> : <>
            <ProductTableWrapped users={props.userList} triggerUpdate={triggerUpdate} productByFarmer={productByFarmerList} farmers={farmerList} isLoggedIn={props.isLoggedIn} user={props.user} timeMachine={props.timeMachine} />
            <WelcomeModal show={welcomeShow} onHide={() => setWelcomeShow(false)} />
        </>
        }
    </>);
}


function ProductTableWrapped(props) {
    const [prodNum, setProdNum] = useState(() => prodNumInit())
    const [searchParameter, setSearchParameter] = useState("");
    const [filteredProducts, setFilteredProducts] = useState([...props.productByFarmer]);
    const [showConfirm, setShowConfirm] = useState(false);
    const handleShowConfirm = () => setShowConfirm(true);
    const [showError, setShowError] = useState(false);
    const handleCloseError = () => setShowError(false);
    const handleShowError = () => setShowError(true);
    const [selectedUser, setSelectedUser] = useState([]);
    const [insertedOrder, setInsertedOrder] = useState();
    const [cartCheckoutModal, setCartCheckoutModal] = useState(false);
    const handleCartCheckoutModalShow = () => setCartCheckoutModal(true);
    const handleCartCheckoutModalClose = () => setCartCheckoutModal(false);
    const [walletAndTotal, setWalletAndTotal] = useState({ Wallet: 0, Money: 0 });
    const mounted = useRef(false);

    var dayjs = require('dayjs');
    var customParseFormat = require('dayjs/plugin/customParseFormat');
    dayjs.extend(customParseFormat);

    var isoWeek = require('dayjs/plugin/isoWeek');
    dayjs.extend(isoWeek);

    function CanOrder() {
        let giorno = dayjs(props.timeMachine(), "MM-DD-YYYY HH:mm:ss");

        if ((giorno.day() === 0 && giorno.hour() < 23) || (giorno.day() === 6 && giorno.hour() > 8)) {
            if (props.user.Role === "Employee" || props.user.Role === "Client") {
                return true;
            }
        }
        return false;
    }

    useEffect(() => {
        mounted.current = true;
        if (props.user.Role === "Client") {
            API.clientCheck({ ClientID: props.user.userID }).then(w => {
                if (mounted.current) {
                    setWalletAndTotal(w);
                }
            }).catch(err => console.log(err));
        }
        else if (selectedUser.length === 0 && mounted.current)
            setWalletAndTotal({ Wallet: 0, Money: 0 });
        else {
            API.clientCheck({ ClientID: selectedUser[0].UserID }).then(w => {
                if (mounted.current) {
                    setWalletAndTotal(w);
                }
            }).catch(err => console.log(err));
        }
        return () => { mounted.current = false };

    }, [cartCheckoutModal, selectedUser, showConfirm]);


    const handleCloseConfirm = () => {
        setShowConfirm(false);
        props.triggerUpdate();
        setProdNum(() => prodNumInit());
    }

    function prodNumInit() {
        let tmp = []
        props.productByFarmer.forEach(p => tmp.push({ "number": 0, "ProductID": p.ProductID, "FarmerID": p.FarmerID, "NameProduct": p.NameProduct, "ImageID": p.ImageID, "Price": p.Price }))
        return tmp;
    }

    function UpdateNumber(i, sign) {
        let prodNumCopy = [...prodNum];
        if (i === -1)
            return;
        else if ((sign === -1 && prodNumCopy[i].number !== 0) || (sign === +1 && prodNumCopy[i].number < props.productByFarmer[i].Quantity))
            prodNumCopy[i].number += sign;

        setProdNum(prodNumCopy);
    }
    function UpdateNumberInput(i, num, product) {
        let prodNumCopy = [...prodNum];
        let input = parseInt(num);
        if (isNaN(input) || input < 0) {
            prodNumCopy[i].number = 0;
        } else {
            if (input > product.Quantity)
                prodNumCopy[i].number = product.Quantity;
            else
                prodNumCopy[i].number = input;
        }
        setProdNum(prodNumCopy);
    }

    async function submitOrder() {
        try {
            let customerID;

            if (props.isLoggedIn)
                if (props.user.Role === "Employee") {
                    if (selectedUser.length === 0)
                        throw { err: "No user selected" };
                    customerID = selectedUser[0].UserID;
                }
                else
                    customerID = props.user.userID


            let items = prodNum.filter(p => p.number !== 0);
            if (items.length === 0)
                throw { err: "No products selected" };

            if (items.length > 0 && (selectedUser.length > 0 || props.user.Role !== "Employee")) {
                let object = {
                    "UserID": customerID,
                    "items": items,
                    "timestamp": props.timeMachine().toString()
                }
                setInsertedOrder(object);
                let res = await API.addOrder(object);
                if (await ! res['err']) { 
                    handleCartCheckoutModalClose();
                    handleShowConfirm();
                } else {
                    console.log("server order error");
                }
            }
            else {
                handleShowError();
            }
        }
        catch (err) {
            console.log(err);
            handleShowError();
        }
    }

    return (
        <>
            <Container >

                <Row className="mt-3 margine-cerca-desktop">
                    <h3>Products orderable from&nbsp;
                        {dayjs(props.timeMachine(), "MM-DD-YYYY HH:mm:ss").day() === 0 ?  dayjs(props.timeMachine(), "MM-DD-YYYY HH:mm:ss").add(-1, 'day').format("dddd D").toString() : dayjs(props.timeMachine(), "MM-DD-YYYY HH:mm:ss").startOf('week').add(6, 'day').format("dddd D").toString()}
                        &nbsp;to&nbsp;
                        {dayjs(props.timeMachine(), "MM-DD-YYYY HH:mm:ss").day() === 0 ?  dayjs(props.timeMachine(), "MM-DD-YYYY HH:mm:ss").format("dddd D MMMM").toString() : dayjs(props.timeMachine(), "MM-DD-YYYY HH:mm:ss").startOf('week').add(7, 'day').format("dddd D MMMM").toString()}</h3>
                </Row>



                <Row className="mt-1 mb-3 margine-cerca-desktop">
                    <SearchBar setFilteredProducts={setFilteredProducts} productByFarmer={props.productByFarmer} searchParameter={searchParameter} setSearchParameter={setSearchParameter} />
                </Row>

                {props.isLoggedIn && CanOrder() ?

                    props.user.Role === "Employee" ? <Row className="mt-3 margine-cerca-desktop">

                        <Col> <UserDropdown users={props.users.filter(u => u.Role === "Client")} selectedUser={selectedUser} setSelectedUser={setSelectedUser} />
                        </Col>
                        <Col xs={3} sm={2} md={2} lg={1} xl={1} xxl={1} style={{ textAlign: 'right' }}>
                            <AvailableAmountButton walletAndTotal={walletAndTotal} user={props.user} isLoggedIn={props.isLoggedIn} selectedUser={selectedUser} />
                        </Col>
                    </Row>
                        : ""

                    : ""}
                <OrderConfirmedModal user={props.user} walletAndTotal={walletAndTotal} isLoggedIn={props.isLoggedIn} selectedUser={selectedUser} prodNum={prodNum} order={insertedOrder} showConfirm={showConfirm} handleCloseConfirm={handleCloseConfirm} />
                <ErrorModal showError={showError} handleCloseError={handleCloseError} />
                <CartCheckoutModal walletAndTotal={walletAndTotal} user={props.user} isLoggedIn={props.isLoggedIn} selectedUser={selectedUser} prodNum={prodNum} submitOrder={submitOrder} order={insertedOrder} cartCheckoutModal={cartCheckoutModal} handleCartCheckoutModalClose={handleCartCheckoutModalClose} />
            </Container>

            <Col className="justify-content-center">
                {

                    filteredProducts.length === 0 || props.productByFarmer.length === 0 ? <NoProductFound /> :
                        <Table className="d-flex justify-content-center">
                            <tbody id="farmer-table" align="center">
                                {props.farmers.map(f =>
                                    <FarmerRow isLoggedIn={props.isLoggedIn} key={f.FarmerID} CanOrder={CanOrder} UpdateNumber={UpdateNumber} UpdateNumberInput={UpdateNumberInput} unfilteredProductByFarmer={props.productByFarmer} prodNum={prodNum} farmer={f} productByFarmer={filteredProducts} />
                                )}
                            </tbody>
                        </Table>



                }

            </Col>

            {props.isLoggedIn && CanOrder() ? <CartBottomButton isLoggedIn={props.isLoggedIn} user={props.user} selectedUser={selectedUser} handleCartCheckoutModalShow={handleCartCheckoutModalShow} prodNum={prodNum} /> : ""}
        </>
    );
};


function NoProductFound() {
    return (<Row style={{ height: "50vh" }} className="align-items-center">

        <div><Image className="d-block mx-auto img-fluid w-30" src="/images/logo.png" />
            <div className="d-flex justify-content-center mt-4"><h4>No products found</h4></div>
        </div>
    </Row>

    );
}


function AvailableAmountButton(props) {
    return (
        <Button disabled variant="secondary">€{(props.walletAndTotal.Wallet - props.walletAndTotal.Money).toFixed(2)}</Button>
    );
}

function CartBottomButton(props) {
    let total = 0;
    props.prodNum.forEach(p => p.number > 0 ? total += p.number * p.Price : "")
    if (props.user.Role === "Employee")
        if (props.selectedUser.length === 0)
            return "";

    return (
        <Button variant="secondary" className="fixed-button-bottom" onClick={props.handleCartCheckoutModalShow}>
            <Cart4 size={25} />
            <span>&nbsp;</span> €{total.toFixed(2)} </Button>
    );

}

function OrderConfirmedModal(props) {
    return (
        <Modal show={props.showConfirm} onHide={props.handleCloseConfirm} autoFocus={true} size="sm" centered>
            <Modal.Header closeButton>
                <Modal.Title>Order submitted! 🎉</Modal.Title>
            </Modal.Header>
            <Modal.Body>Total of your "open" orders: €{(props.walletAndTotal.Money)}</Modal.Body>
            <Modal.Body>Wallet amount: €{(props.walletAndTotal.Wallet)}</Modal.Body>
            <Modal.Footer>
                <Button variant="warning" onClick={props.handleCloseConfirm}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>);
}




function CartCheckoutModal(props) {
    let total = 0;
    props.prodNum.forEach(p => total += p.Price * p.number);

    return (
        <Modal show={props.cartCheckoutModal} onHide={props.handleCartCheckoutModalClose} autoFocus={true} size="md" centered>
            <Modal.Header closeButton>
                <Modal.Title>Checkout cart 🛒</Modal.Title>
            </Modal.Header>
            <Modal.Body >
                {props.prodNum.some(p => p.number > 0) && total > props.walletAndTotal.Wallet - props.walletAndTotal.Money ? <p>⚠️ The total is more than the wallet availability (€{(props.walletAndTotal.Wallet - props.walletAndTotal.Money).toFixed(2)})</p> : ""}

                {props.prodNum.some(p => p.number > 0) ? "" : "The cart is empty"}

                <Table className="justify-content-center">
                    <tbody align="center">
                        {props.prodNum.map(p => p.number !== 0 ?
                            <ProductList key={"ord" + p.ProductID + p.FarmerID} product={p} /> : "")}
                    </tbody>
                </Table>
            </Modal.Body>
            <Modal.Footer>
                <Col><Button onClick={props.submitOrder} disabled={props.prodNum.some(p => p.number > 0) ? false : true} variant="success">Submit Order</Button></Col>
                <Col style={{ textAlign: 'right', marginRight: '18px' }}>Total €{total.toFixed(2)}</Col>
            </Modal.Footer>
        </Modal>);
}

function ErrorModal(props) {
    return (
        <Modal show={props.showError} onHide={props.handleCloseError} autoFocus={true} size="sm" centered>
            <Modal.Header closeButton>
                <Modal.Title>Warning! ⚠️</Modal.Title>
            </Modal.Header>
            <Modal.Body>Select at least a product or a customer.</Modal.Body>
            <Modal.Footer>
                <Button variant="warning" onClick={props.handleCloseError}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

function FarmerRow(props) {
    let product = [];

    const splitEvery = (array, length) =>
        array.reduce(
            (result, item, index) => {
                if (index % length === 0) result.push([])
                result[Math.floor(index / length)].push(item)
                return result
            },
            []
        );

    props.productByFarmer.map(p => p.FarmerID === props.farmer.FarmerID ? product.push(p) : '')

    if (product.length > 0)
        return (<>
            <tr>
                <td className="producttable-col">

                    <Container>

                        <Row className="mt-2">
                            <h1 style={{ fontSize: 28 }} align={"left"}>{props.farmer.Company}</h1>
                        </Row>

                        <Row className="mb-3">
                            <section className="d-flex justify-content-between">
                                <div> <PersonFill /><span>&nbsp;</span>
                                    {props.farmer.Name}<span>&nbsp;</span>{props.farmer.Surname}
                                </div>
                                <div>
                                    <GeoAltFill className="ml-3" /><span>&nbsp;</span>
                                    {props.farmer.Address}<span>,&nbsp;</span>{props.farmer.State}
                                </div>
                            </section>
                        </Row>

                        {splitEvery(product, 3).map((p, index) => (
                            <Row key={index + "_" + props.farmer.FarmerID} className="mb-xl-4">
                                {p.map(pf => (
                                    <Col key={pf.ProductID + "_" + pf.FarmerID} xl className="column-margin">
                                        <ProductCard CanOrder={props.CanOrder} isLoggedIn={props.isLoggedIn} unfilteredProductByFarmer={props.unfilteredProductByFarmer} prodNum={props.prodNum} productByFarmer={props.productByFarmer} prodottoDelFarmer={pf} UpdateNumberInput={props.UpdateNumberInput} UpdateNumber={props.UpdateNumber} />
                                    </Col>
                                )
                                )
                                }
                                {p.length === 2 ? <> <Col> </Col> </> : ''}
                                {p.length === 1 ? <> <Col> </Col> <Col> </Col> </> : ''}
                            </Row>
                        ))}

                    </Container>
                </td>
            </tr>
        </>
        );
    else
        return "";

};

function ProductCard(props) {
    const [available, setAvailable] = useState(props.prodottoDelFarmer.Quantity);
    const [showDesc, setShowDesc] = useState(false);
    const handleCloseDesc = () => setShowDesc(false);
    const handleShowDesc = () => setShowDesc(true);

    function addAvail() {
        if (available > 0) {
            setAvailable(available - 1);
        }
    }

    function removeAvail() {
        if (available < props.prodottoDelFarmer.Quantity) {
            setAvailable(available + 1);
        }
    }

    function handleNum(num) {
        if (num === '') {
            setAvailable(parseInt(props.prodottoDelFarmer.Quantity));
        }
        if (parseInt(parseInt(num)) > parseInt(props.prodottoDelFarmer.Quantity)) {
            setAvailable(0);
        }
        if (parseInt(props.prodottoDelFarmer.Quantity) >= parseInt(num)) {
            setAvailable(parseInt(props.prodottoDelFarmer.Quantity) - parseInt(num));
        }
    }

    let newSrc = "/images/" + props.prodottoDelFarmer.ImageID + ".png"

    return (
        <Card style={{ width: '21rem' }} >
            <Card.Img variant="top" className="cover" src={newSrc} />
            <Card.Body>
                <Card.Title>{props.prodottoDelFarmer.NameProduct}</Card.Title>
                <Card.Text>
                </Card.Text>
            </Card.Body>
            <Container>
                <Row style={{marginTop:'-0.8em'}}>
                    <Col><Collection /></Col>
                    <Col><Bag /></Col>
                    <Col><Cash /></Col>
                </Row>
                <Row className="mb-4">
                    <Col style={{fontSize : "13px"}}>Available: {available}</Col>
                    <Col style={{fontSize : "13px"}}>Unit: {props.prodottoDelFarmer.UnitOfMeasurement}</Col>
                    <Col style={{fontSize : "13px"}}>€{props.prodottoDelFarmer.Price}</Col>
                </Row>
            </Container>
            <Card.Footer>
                <Row>
                    <Col> <Button variant="outline-warning"
                        style={{ fontSize: 14, color: "black" }}
                        onClick={handleShowDesc}>
                        See Description
                    </Button></Col>
                    {props.isLoggedIn && props.CanOrder() ? <Col><ProductsCounter addAvail={addAvail} removeAvail={removeAvail} handleNum={(num) => handleNum(num)} unfilteredProductByFarmer={props.unfilteredProductByFarmer} UpdateNumberInput={props.UpdateNumberInput} UpdateNumber={props.UpdateNumber} prodNum={props.prodNum} productByFarmer={props.productByFarmer} prodottoDelFarmer={props.prodottoDelFarmer} Quantity={props.prodottoDelFarmer.Quantity} ProductID={props.prodottoDelFarmer.ProductID} FarmerID={props.prodottoDelFarmer.FarmerID} /></Col> : ""}
                </Row>
                <Modal show={showDesc} onHide={handleCloseDesc} centered size="lg">
                    <DescriptionModal handleCloseDesc={handleCloseDesc} prodotto={props.prodottoDelFarmer} imgProd={newSrc} />
                </Modal>
            </Card.Footer>
        </Card >
    );
}

function DescriptionModal(props) {
    return (<>
        <Modal.Body>
            <Container>
                <Row style={{ textAlign: "center" }}>
                    <h3>{props.prodotto.NameProduct}</h3>
                </Row>
                <Row className="mt-2">
                    <Col style={{ textAlign: "center", display: "block", marginBottom: "auto", marginTop: "auto" }} xl ><Image style={{ maxHeight: "300px", maxWidth: "300px" }} src={props.imgProd} /></Col>
                    <Col>
                        <Row className="justify-content-center desc-mobile-margin">
                            <ListGroup>
                                <ListGroup.Item><p>{props.prodotto.Description}</p></ListGroup.Item>
                            </ListGroup>
                        </Row>
                    </Col>
                </Row>
            </Container>

        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={props.handleCloseDesc}>
                Close
            </Button>
        </Modal.Footer>
    </>
    );
}


function ProductsCounter(props) {
    let i = props.unfilteredProductByFarmer.findIndex(p => (p.ProductID === props.prodottoDelFarmer.ProductID && p.FarmerID === props.prodottoDelFarmer.FarmerID))
    return (
        <InputGroup style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ToggleButton style={{ maxHeight: "2.2rem", fontSize: 15, borderTopLeftRadius: '4px', borderBottomLeftRadius: '4px' }} disabled={props.prodottoDelFarmer.Quantity === 0 ? true : false} variant="outline-secondary" onClick={() => { props.UpdateNumber(i, -1); props.removeAvail() }}>
                -
            </ToggleButton>
            <FormControl onChange={(event) => { props.UpdateNumberInput(i, event.target.value, props.prodottoDelFarmer); props.handleNum(event.target.value); }} disabled={props.prodottoDelFarmer.Quantity === 0 ? true : false} style={{ textAlign: "center", maxHeight: "2.3rem", fontSize: 14, maxWidth: "2.7rem", background: 'white', color: 'black' }} value={props.prodNum[i].number} />
            <ToggleButton style={{ maxHeight: "2.2rem", fontSize: 15 }} disabled={props.prodottoDelFarmer.Quantity === 0 ? true : false} variant="outline-secondary" onClick={() => { props.UpdateNumber(i, +1); props.addAvail() }} >
                +
            </ToggleButton>
        </InputGroup >
    );
}


function SearchBar(props) {


    function ManageSearch(text) {
        props.setSearchParameter(text);
        props.setFilteredProducts(props.productByFarmer.filter(p => p.NameProduct.toLowerCase().includes(text.trim().toLowerCase())));
    }

    return (

        <Form onSubmit={(event) => event.preventDefault()}  >
            <Form.Control placeholder="🔍 Search for a product..." type='text' value={props.searchParameter} onChange={(event) => { ManageSearch(event.target.value) }} />

        </Form>

    );
}



export default ProductTable;
