import API from '../API';
import { useState, useEffect } from 'react';
import { Table, Row, Col, Container, Button, Image, Spinner, Dropdown, DropdownButton, ProgressBar } from 'react-bootstrap';
import { PersonFill, GeoAltFill, ClockFill } from 'react-bootstrap-icons';
import "./EmployeeView.css";
import UserDropdown from "./CustomerSearchBar"
import Modal from 'react-bootstrap/Modal'
import {TimeSelect, ErrorModal} from './ClientOrders.js'

var dayjs = require('dayjs');
var customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);


function EmployeeView(props) {

    const [ordersList, setOrdersList] = useState([]);
    const [ordersListUpdated, setOrdersListUpdated] = useState(true);
    const [selectedUser, setSelectedUser] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (ordersListUpdated === true) {
            setLoading(true);
            API.getOrders(props.timeMachine().toString())
                .then(orders => {
                    setOrdersList(orders.sort((b,a) => (dayjs(a.Timestamp, "DD-MM-YYYY HH:mm:ss").isAfter(dayjs(b.Timestamp, "DD-MM-YYYY HH:mm:ss")) ? 1 : -1)  )   )
                    setOrdersListUpdated(false);
                    setLoading(false);
                }).catch(o => handleErrors(o));
        }
    }, [ordersListUpdated]);

    useEffect(() => {
        if (props.reloadTime)
            setOrdersListUpdated(true);
    }, [props.reloadTime])

    const handleErrors = (err) => {

        console.log(err);
    }

    return (
        <>


            {loading ? <> <Row className="justify-content-center mt-5">
                < Spinner animation="border" size="xl" variant="secondary" />
            </Row > </> : props.user.Role !== "Employee" ? "" :
                <>           
                <Container>
                    <Row className="mt-3 margine-cerca-desktop">
                        <UserDropdown users={props.users} selectedUser={selectedUser} setSelectedUser={setSelectedUser} />
                    </Row>
                </Container>
                    <Col>
                        <Table className="d-flex justify-content-center">
                            <tbody id="employee-table" align="center">
                                {ordersList.filter(ol => props.status === "all" ? true : ol.Status === props.status).length > 0 ? <>
                                    {
                                        ordersList.filter(ol => props.status === "all" ? true : ol.Status === props.status).length > 0 && selectedUser.length > 0 && !ordersList.filter(ol => props.status === "all" ? true : ol.Status === props.status).some(ord => ord.ClientID === selectedUser[0].UserID) ? <NoOrders message={"There are no" + (props.status === "all" ? "" : " " + props.status) + " orders for the selected user"} /> :
                                            ordersList.filter(ol => props.status === "all" ? true : ol.Status === props.status).map(o => {

                                                if (selectedUser.length > 0 && o.ClientID === selectedUser[0].UserID || selectedUser.length === 0) {

                                                    return <OrderRow key={o.OrderID} order={o} timeMachine={props.timeMachine} reloadOrders={() => setOrdersListUpdated(true)}/>

                                                }
                                            }
                                            )
                                    } </> : <NoOrders message={"There are no" + (props.status === "all" ? "" : " " + props.status) + " orders yet"} />}
                            </tbody>
                        </Table>
                    </Col>
                </>
            }
        </>
    );
}

let progressRate = 0;
let progressType = "success";


function OrderRow(props) {
    let [stat, setStat] = useState(props.order.Status || 'o');
    const [modalShow, setModalShow] = useState(false);
    const [modalErrorShow, setModalErrorShow] = useState(false);
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    async function handleCloseTime(newdate, address) {
        setModalShow(false);
        if (newdate) {
            try {
                console.log(address + ": if returned is false everything is okay")
                let object = {
                    "pickupTimestamp": newdate.toString(),
                    "OrderID": props.order.OrderID
                }
                let res = await API.setPickUpTime(object);
            } catch (err) {
                console.log(err);
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
        stat = 'o';
        progressType = "primary";
        buttonstatus = "outline-primary";
        progressRate = 33;
    } else if (props.order.Status === "pending") {
        buttonstatus = "outline-warning";
        stat = 'p';
        progressType = "warning";
        progressRate = 66;

    } else if (props.order.Status === "closed") {
        buttonstatus = "outline-success";
        stat = 'c';
        progressType = "success";
        progressRate = 100;
    } else if (props.order.Status === "cancelled") {
        stat = 'canc'
        buttonstatus = "outline-danger";
        progressType = "danger"
        progressRate = 100;
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

                        <Table className="justify-content-center">
                            <tbody align="center">
                                {props.order.ProductInOrder.map( (p, i)  => (
                                    <ProductList key={props.order.OrderID+"+"+p.ProductID+i} product={p} />
                                ))}
                            </tbody>
                        </Table>

                        <ProgressBar variant={progressType} now={progressRate} />

                        <Row className="mt-4 mb-3 align-items-center">
                            <Col>
                                <h1 style={{ fontSize: 15, marginTop: 10 }}>Total: €{props.order.ProductInOrder.reduce((sum, p) => { if(p.Confirmed !== "false") 
                                return (sum + parseInt(p.number) * parseFloat(p.Price))
                                else 
                                return (sum + 0) }, 0)}</h1>
                            </Col>

                            {(props.order.DeliveryDate === '' && props.order.pickupTimestamp === '' && props.order.Status !== "cancelled") ? <>
                                <Col>
                                    <Button variant="outline-secondary" size="sm" onClick={setModalShow} >Request Pickup</Button>
                                    <TimeSelect deliveryMode={false} show={modalShow} showError={() => showErrorModal()} onHide={handleCloseTime} timeMachine={props.timeMachine} getTime={props.timeMachine()} />
                                    <ErrorModal deliveryMode={false} show={modalErrorShow} onHide={() => setModalErrorShow(false)} />
                                </Col>
                            </> : <></>}

                            {props.order.DeliveryDate !== '' ? <>
                                <Col style={{ fontSize: '13px' }}>
                                    Delivery requested for {props.order.DeliveryDate}
                                </Col>
                            </> : <></>}

                            {props.order.pickupTimestamp !== '' ? <>
                                <Col style={{ fontSize: '13px' }}>
                                    Pickup requested {props.order.pickupTimestamp}
                                </Col>
                            </> : <></>}

                            <Col>

                                {props.order.Status === "closed" ? <Button size="sm" variant="outline-success">Closed</Button> : ''}
                                {props.order.Status === "closed" ? '' : <>
                                    <DropdownButton title={props.order.Status.charAt(0).toUpperCase() + props.order.Status.slice(1)} variant={buttonstatus} size="sm">
                                        <Dropdown.Item onClick={() => {
                                            props.order.Status = "open";
                                            setStat('o');
                                            API.modifyOrderStatus(props.order);
                                            progressRate = 10;
                                            handleShow();
                                        }}>Open</Dropdown.Item>

                                        {props.order.Status !== "cancelled" ? <>
                                    
                                        <Dropdown.Item onClick={() => {
                                            props.order.Status = "pending";
                                            setStat('p');
                                            progressRate = 49;
                                            API.modifyOrderStatus(props.order);
                                            handleShow();

                                        }

                                        }>Pending</Dropdown.Item>
                                        <Dropdown.Item onClick={() => {
                                            props.order.Status = "closed";
                                            setStat('c');
                                            progressRate = 99;
                                            handleShow();

                                            API.modifyOrderStatus(props.order);

                                        }}>Closed</Dropdown.Item>
                                        <Dropdown.Item onClick={() => {
                                            props.order.Status = "cancelled";
                                            setStat('canc');
                                            progressRate = 100;
                                            API.modifyOrderStatus(props.order);
                                            handleShow();
                                        }}>Cancelled</Dropdown.Item>

                                        </> : '' }
                                    </DropdownButton >

                                </>}
                                <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false} >
                                    <Modal.Header closeButton>
                                        <Modal.Title>Status Change!</Modal.Title>
                                    </Modal.Header>
                                    <Modal.Body>
                                        The order status has been changed to {props.order.Status}
                                    </Modal.Body>
                                    <Modal.Footer>
                                        <Button variant="secondary" onClick={handleClose}> Close </Button>
                                    </Modal.Footer>
                                </Modal>
                            </Col>
                        </Row>

                    </Container>
                </td>
            </tr>
        </>
    );
}


function ProductList(props) {

    let newSrc = "/images/" + props.product.ImageID + ".png"

    return (
        <tr>
            <td>
                <Container>
                    <Row className="mb-2 align-items-center font-tabella" style={{textDecoration : props.product.Confirmed === "false" ? "line-through" : "none" }}>
                        <Col>
                            <Image src={newSrc} height={"50 px"} rounded />
                        </Col>
                        
                        <Col >
                            <center>{props.product.NameProduct}</center>
                        </Col>
                        <Col>
                            Quantity: {props.product.number}
                        </Col>
                        <Col>
                            Price: €{props.product.Price.toFixed(2)}
                        </Col>
                    </Row>
                </Container>
            </td>
        </tr>
    );
}

function NoOrders(props) {
    return (<Row style={{ height: "50vh" }} className="align-items-center">

        <div><Image className="d-block mx-auto img-fluid w-30" src="/images/logo.png" />
            <div className="d-flex justify-content-center "><h4>{props.message}</h4></div>
        </div>
    </Row>

    );
}


export { ProductList, EmployeeView };
