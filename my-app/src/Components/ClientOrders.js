import API from '../API';
import { useState, useEffect } from 'react';
import { Table, Row, Col, Container, Modal, Form, Button, Image, Spinner } from 'react-bootstrap';
import { PersonFill, GeoAltFill, ClockFill } from 'react-bootstrap-icons';
import "./ClientOrders.css";

var dayjs = require('dayjs');
var customParseFormat = require('dayjs/plugin/customParseFormat');
var isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);


function ClientOrders(props) {
    const [ordersList, setOrdersList] = useState([]);
    const [ordersListUpdated, setOrdersListUpdated] = useState(true);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        if (ordersListUpdated === true) {
            setLoading(true);
            API.getClientOrders(props.timeMachine().toString())
                .then(orders => {
                    setOrdersList(orders.sort((b, a) => (dayjs(a.Timestamp, "DD-MM-YYYY HH:mm:ss").isAfter(dayjs(b.Timestamp, "DD-MM-YYYY HH:mm:ss")) ? 1 : -1)))
                    setOrdersListUpdated(false);
                    setLoading(false);
                }).catch(o => handleErrors(o));
        }
    }, [ordersListUpdated]);

    const handleErrors = (err) => {
        console.log(err);
    }

    useEffect(() => {
        if (props.reloadTime)
            setOrdersListUpdated(true);
    }, [props.reloadTime])

    return (
        <>
            {loading ? <> <Row className="justify-content-center mt-5">
                < Spinner animation="border" size="xl" variant="secondary" />
            </Row > </> :
                <>
                    <Row>
                        <Col>
                            <Table className="d-flex justify-content-center">
                                <tbody id="employee-table" align="center">

                                    {ordersList.length > 0 ? ordersList.map(o =>
                                        <OrderRow key={o.OrderID} order={o} timeMachine={props.timeMachine} reloadOrders={() => setOrdersListUpdated(true)} />
                                    ) : <NoOrders />
                                    }

                                </tbody>
                            </Table>
                        </Col>
                    </Row>
                </>
            }
        </>
    );
}


const ostat = {
    'o': 'open',
    'p': 'pending',
    'c': 'closed'
}

function OrderRow(props) {
    const [modalShow, setModalShow] = useState(false);
    const [deliveryMode, setDeliveryMode] = useState(false);
    const [modalErrorShow, setModalErrorShow] = useState(false);

    const toggleModalPickup = () => {
        setModalShow(!modalShow);
        setDeliveryMode(false);
    }

    const toggleModalDelivery = () => {
        setModalShow(!modalShow);
        setDeliveryMode(true);
    }


    async function handleClose(newdate, address) {
        setModalShow(false);
        if (newdate) {
            if (address) {
                try {
                    let objectDelivery = {
                        "OrderID": props.order.OrderID,
                        "DeliveryPlace": address,
                        "DeliveryDate": newdate.toString()
                    }
                    let resDelivery = await API.modifyDelivery(objectDelivery);
                } catch (err) {
                    console.log(err);
                }

            }
            else {
                try {
                    let object = {
                        "pickupTimestamp": newdate.toString(),
                        "OrderID": props.order.OrderID
                    }
                    let res = await API.setPickUpTime(object);
                } catch (err) {
                    console.log(err);
                }
            }

            props.reloadOrders();
        }
    }

    function showErrorModal() {
        setModalShow(false);
        setModalErrorShow(true);
    }

    let buttonstatus;
    if (props.order.Status === "open") {
        buttonstatus = "primary";
    } else if (props.order.Status === "pending") {
        buttonstatus = "warning";
    } else if (props.order.Status === "closed") {
        buttonstatus = "success";
    } else if (props.order.Status === "cancelled") {
        buttonstatus = "danger";
    }

    return (
        <>
            <tr>
                <td>

                    <Container>

                        <Row className="mt-2">
                            <h1 style={{ fontSize: 25 }} align={"left"}>Order #{props.order.OrderID}</h1>
                        </Row>

                        <Row className="mb-3 sfondoriga">
                            <Row>
                                <Col><PersonFill /></Col>
                                <Col><ClockFill /></Col>
                                <Col><GeoAltFill /></Col>
                            </Row>

                            <Row className="mb-1">
                                <Col className="ridotto-mobile">{props.order.Name} {props.order.Surname}</Col>
                                <Col className="ridotto-mobile">{props.order.Timestamp}</Col>
                                <Col className="ridotto-mobile">{props.order.Address}, {props.order.State}</Col>
                            </Row>
                        </Row>

                        {props.order.ProductInOrder.map((p, idx) => (
                            <ProductList key={p.ProductID + "+" + props.order.OrderID + idx} product={p} />
                        ))}

                        <Row className="mt-4 mb-3 align-items-center">
                            <Col>
                                <h1 style={{ fontSize: 15, marginTop: 10 }}>Total: €{props.order.ProductInOrder.reduce((sum, p) => {
                                    if (p.Confirmed !== "false")
                                        return (sum + parseInt(p.number) * parseFloat(p.Price))
                                    else
                                        return (sum + 0)
                                }, 0)}</h1>
                            </Col>

                            {(props.order.DeliveryDate === '' && props.order.pickupTimestamp === '' && props.order.Status !== "cancelled") ? <>
                                <Col>
                                <Button variant="outline-secondary" size="sm" onClick={toggleModalDelivery} >Request Delivery</Button>
                                </Col>
                            </> : <></>}

                            {(props.order.DeliveryDate === '' && props.order.pickupTimestamp === '' && props.order.Status !== "cancelled") ? <>
                                <Col>
                                    <Button variant="outline-secondary" size="sm" onClick={toggleModalPickup} >Request Pickup</Button>
                                </Col>
                            </> : <></>}

                            {props.order.DeliveryDate !== '' ? <>
                                <Col style={{ fontSize: '13px' }}>
                                    Delivery requested {props.order.DeliveryDate}
                                </Col>
                            </> : <></>}

                            {props.order.pickupTimestamp !== '' ? <>
                                <Col style={{ fontSize: '13px' }}>
                                    Pickup requested {props.order.pickupTimestamp}
                                </Col>
                            </> : <></>}

                            <Col>
                                <Button variant={buttonstatus} size="sm" disabled> {props.order.Status} </Button>
                            </Col>
                            <TimeSelect deliveryMode={deliveryMode} show={modalShow} showError={() => showErrorModal()} onHide={handleClose} timeMachine={props.timeMachine} getTime={props.timeMachine()} />
                            <ErrorModal deliveryMode={deliveryMode} show={modalErrorShow} onHide={() => setModalErrorShow(false)} />

                        </Row>

                    </Container>
                </td>
            </tr>
        </>
    );
}

function TimeSelect(props) {

    const now_time = new Object();
    const now_date = new Object();
    now_time.value = dayjs().format('HH:mm');
    now_date.value = dayjs().format('YYYY-MM-DD');
    var newdate = "";

    const [time, setTime] = useState(now_time);
    const [date, setDate] = useState("");
    const [address, setAddress] = useState("");

    var mercoledi = '', giovedi = '', venerdi = '';

    function setDay() {

        if (dayjs(dayjs(props.timeMachine(), 'MM-DD-YYYY')).day() === 6) { //sabato
            mercoledi = dayjs(dayjs(props.timeMachine(), 'MM-DD-YYYY')).add(4, 'day');
            giovedi = dayjs(dayjs(props.timeMachine(), 'MM-DD-YYYY')).add(5, 'day');
            venerdi = dayjs(dayjs(props.timeMachine(), 'MM-DD-YYYY')).add(6, 'day');

        }

        if (dayjs(dayjs(props.timeMachine(), 'MM-DD-YYYY')).day() === 0) { //domenica
            mercoledi = dayjs(dayjs(props.timeMachine(), 'MM-DD-YYYY')).add(3, 'day');
            giovedi = dayjs(dayjs(props.timeMachine(), 'MM-DD-YYYY')).add(4, 'day');
            venerdi = dayjs(dayjs(props.timeMachine(), 'MM-DD-YYYY')).add(5, 'day');

        }

        if (dayjs(dayjs(props.timeMachine(), 'MM-DD-YYYY')).day() === 1) { //lunedi
            mercoledi = dayjs(dayjs(props.timeMachine(), 'MM-DD-YYYY')).add(2, 'day');
            giovedi = dayjs(dayjs(props.timeMachine(), 'MM-DD-YYYY')).add(3, 'day');
            venerdi = dayjs(dayjs(props.timeMachine(), 'MM-DD-YYYY')).add(4, 'day');

        }
        if (dayjs(dayjs(props.timeMachine(), 'MM-DD-YYYY')).day() === 2) { //martedi
            mercoledi = dayjs(dayjs(props.timeMachine(), 'MM-DD-YYYY')).add(1, 'day');
            giovedi = dayjs(dayjs(props.timeMachine(), 'MM-DD-YYYY')).add(2, 'day');
            venerdi = dayjs(dayjs(props.timeMachine(), 'MM-DD-YYYY')).add(3, 'day');
        }
        if (dayjs(dayjs(props.timeMachine(), 'MM-DD-YYYY')).day() === 3) { //mercoledi
            giovedi = dayjs(dayjs(props.timeMachine(), 'MM-DD-YYYY')).add(1, 'day');
            venerdi = dayjs(dayjs(props.timeMachine(), 'MM-DD-YYYY')).add(2, 'day');
        }
        if (dayjs(dayjs(props.timeMachine(), 'MM-DD-YYYY')).day() === 4) { //giovedi
            venerdi = dayjs(dayjs(props.timeMachine(), 'MM-DD-YYYY')).add(1, 'day');
        }

        return ""
    }

    function onSubmit() {

        if (time.value > "19:00" || time.value < "09:00" || date === "") {
            props.showError();
        }
        else if (props.deliveryMode && address === "") {
            props.showError();
        }
        else if (date.value === "1") {
            if (time.value < "19:00" && time.value > "09:00") {
                newdate = (dayjs(mercoledi).format('MM-DD-YYYY') + " " + time.value + ":00");
                props.deliveryMode ? props.onHide(newdate, address) : props.onHide(newdate, false) 
            }
        }
        else if (date.value === "2") {
            if (time.value < "19:00" && time.value > "09:00") {
                newdate = (dayjs(giovedi).format('MM-DD-YYYY') + " " + time.value + ":00");
                props.deliveryMode ? props.onHide(newdate, address) : props.onHide(newdate, false) 
            }
        }
        else if (date.value === "3") {
            if (time.value < "19:00" && time.value > "09:00") {
                newdate = (dayjs(venerdi).format('MM-DD-YYYY') + " " + time.value + ":00");
                props.deliveryMode ? props.onHide(newdate, address) : props.onHide(newdate, false) 
            }
        }

    }

    return (
        <Modal {...props} size="lg" aria-labelledby="contained-modal-title-vcenter" centered>
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    Select a date for {props.deliveryMode ? "home delivery" : "pickup on-site"}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {setDay()}
                <Form onSubmit={(event) => event.preventDefault()}>
                    {props.deliveryMode ?
                        <Row className="justify-content-center">
                            <Col lg={7} xl={7} md={7} sm={10} xs={10}>
                                <Form.Group className="mt-2">
                                    <Form.Label>Delivery address</Form.Label>
                                    <Form.Control type="text" defaultValue="" onChange={e => setAddress({ value: e.target.value })} />
                                </Form.Group>
                            </Col>
                        </Row>
                        : ""}
                    <Row className="justify-content-center">
                        <Col lg={4} xl={4} md={4} sm={6} xs={6}>
                            <Form.Group className="mt-2" controlId="chosendate">
                                <Form.Label>Date</Form.Label>
                                <Form.Select onChange={e => setDate({ value: e.target.value })} >
                                    <option>Select a date...</option>
                                    {mercoledi !== '' ? <option value={"1"}>Wednesday {(dayjs(dayjs(mercoledi, 'MM-DD-YYYY'))).format('DD/MM/YYYY').toString()}</option> : ''}
                                    {giovedi !== '' ? <option value={"2"}>Thursday {(dayjs(dayjs(giovedi, 'MM-DD-YYYY'))).format('DD/MM/YYYY').toString()}</option> : ''}
                                    {venerdi !== '' ? <option value={"3"}>Friday {(dayjs(dayjs(venerdi, 'MM-DD-YYYY'))).format('DD/MM/YYYY').toString()}</option> : ''}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col lg={3} xl={3} md={3} sm={4} xs={4}>
                            <Form.Group className="mt-2" controlId="chosentime">
                                <Form.Label>Time</Form.Label>
                                <Form.Control type="time" defaultValue={time.value.toString()} onChange={e => setTime({ value: e.target.value })} />
                            </Form.Group>
                        </Col>

                        <Row className="justify-content-center mt-3" style={{ fontSize: '17px' }}>
                            Select a {props.deliveryMode ? "delivery" : "pickup"} date from Wednesday to Friday in 09:00-19:00 range
                        </Row>
                    </Row>

                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="warning" onClick={onSubmit}>Confirm</Button>
            </Modal.Footer>
        </Modal>
    );
}


function ProductList(props) {

    let newSrc = "/images/" + props.product.ImageID + ".png"

    return (

        <Row className="mb-2 align-items-center" style={{ textDecoration: props.product.Confirmed === "false" ? "line-through" : "none" }}>
            <Col>
                <Image src={newSrc} height={"60 px"} rounded />
            </Col>
            <Col>
                <center>{props.product.NameProduct}</center>
            </Col>
            <Col>
                Quantity: {props.product.number}
            </Col>
            <Col>
                Price: €{props.product.Price.toFixed(2)}
            </Col>
        </Row>
    );
}
function ErrorModal(props) {
    return (
        <Modal {...props} size="sm" aria-labelledby="contained-modal-title-vcenter" centered>
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    {props.deliveryMode? "Error requesting delivery" : "Error requesting pickup"}

                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
            {props.deliveryMode? <p>Make sure you have selected a date, chosen a correct time range (09:00-19:00) or entered a valid address</p> : <p>Make sure you have selected a date or chosen a correct time range (09:00-19:00)</p>}                
            </Modal.Body>
            <Modal.Footer>
                <Button variant="danger" onClick={props.onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
}

function NoOrders() {
    return (
        <tr>
            <td>
                <h3 className="mt-5 mb-5">You have no orders yet</h3>
            </td>
        </tr>
    );
}

export { ClientOrders, TimeSelect, ErrorModal };
