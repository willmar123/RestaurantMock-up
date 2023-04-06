import { Navbar, Nav, Button, Image, Container, Offcanvas, NavDropdown, Col, Row, Modal, Form, CloseButton } from 'react-bootstrap';
import "./Navbar.css";
import { useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { House, DoorOpen, Stopwatch, PersonCircle, BoxSeam, PersonVideo2, Bucket, Telegram, Kanban } from 'react-bootstrap-icons';
import { WelcomeFarmerSidebar } from "../Images/WelcomeFarmer.js";
import DeLorean from "../Images/DeLorean.js";
import API from '../API';

var dayjs = require('dayjs');
var customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);


function ZeroNavbar(props) {
    const [modalShow, setModalShow] = useState(false); 
    const handleOpenSide = () => props.setSideShow(true);
    const handleCloseSide = () => props.setSideShow(false);

    const location = useLocation();
    const history = useHistory();

    function handleLogout() {
        props.logout();
        history.push('/signout');
    }

    function handleHome() {
        handleCloseSide();
        history.push('/');
    }

    function handleTime() {
        setModalShow(true);
    }

    function handleLogin() {
        history.push('/login');
    }

    function handleSignup() {
        history.push('/signupClient');
    }

    function handleClose(newdate) {
        setModalShow(false);
        handleCloseSide();
        if (newdate)
            props.setTimeMachine(newdate);
    }

    function handleTelegram() {
        window.open('https://t.me/zeromiles_spg', '_blank');
    }

    return (
        <Navbar bg="warning" expand={false}>
            <Container>

                <Navbar.Brand className="logo" onClick={handleHome}>
                    <Image id="logo" src="/images/calisaborLogo.png" />
                </Navbar.Brand>

                {!props.isLoggedIn ? <>
                    <div style={{ marginTop: '0.9rem' }} className="posizionamento-login">
                        <Button style={{ marginRight: '0.5rem', fontSize: "14px" }} variant="outline-secondary" onClick={handleSignup}>Signup</Button>
                        <Button style={{ fontSize: "14px" }} variant="secondary" onClick={handleLogin}>Login</Button>
                    </div>
                </> : <>

                    <Navbar.Toggle aria-controls="offcanvasNavbar" className="posizionamento-pulsante" onClick={handleOpenSide} />
                    <Navbar.Offcanvas
                        id="offcanvasNavbar"
                        aria-labelledby="offcanvasNavbarLabel"
                        placement="end"
                        className="bg-sidebar"
                        show={props.sideShow}
                        onHide={handleCloseSide}
                    >
                        <Offcanvas.Header style={{ background: '#6c757d' }}>
                            <Container>
                                <Row>
                                    <Col xl={2} lg={2} className="justify-content-center d-none d-md-block">
                                        <PersonCircle style={{ fontSize: '40px', color: 'white' }} />
                                    </Col>
                                    <Col>
                                        <Offcanvas.Title id="offcanvasNavbarLabel" style={{ fontSize: 23, color: "white", textAlign: 'center' }}>Welcome, {props.user.Name}!</Offcanvas.Title>
                                    </Col>
                                    <Col xl={2} lg={2} md={2} sm={2} xs={2}>
                                        <CloseButton onClick={handleCloseSide} variant="white" style={{ marginLeft: '20px', marginTop: '5px' }} />
                                    </Col>
                                </Row>
                            </Container>


                        </Offcanvas.Header>

                        <Offcanvas.Body>

                            <Row style={{ textAlign: 'center' }} className="mt-3">

                                {location.pathname === '/' ? <></> : <>
                                    <Col>
                                        <Button className="logout-button" variant="warning" size="sm" onClick={handleHome}><House style={{ marginTop: '-4px', marginRight: '4px' }} />Home</Button>
                                    </Col>
                                </>
                                }

                                {!props.timedev ? <></> : <>
                                    <Col>
                                        <Button className="logout-button" variant="warning" size="sm" onClick={handleTime}><Stopwatch style={{ marginTop: '-4px', marginRight: '4px' }} />Set Time</Button>
                                        <TimeMachine show={modalShow} onHide={(newdate) => handleClose(newdate)} />
                                    </Col>
                                </>}

                                <Col>
                                    <Button className="logout-button" variant="warning" size="sm" onClick={handleLogout}><DoorOpen style={{ marginTop: '-4px', marginRight: '4px' }} />Logout</Button>
                                </Col>

                                <Row style={{marginLeft:'0.2em', marginTop:'0.3em'}}>
                                    {props.timeMachine ? "TimeMachine set: "+ props.timeMachine : "" }
                                </Row>
                                

                            </Row>

                            {props.user.Role === "Employee" ? <EmployeeSidebar setSideShow={props.setSideShow} /> : <></>}

                            {props.user.Role === "Client" ? <ClientSidebar setSideShow={props.setSideShow} /> : <></>}

                            {props.user.Role === "Farmer" ? <FarmerSidebar ReturnTimeMachine={props.ReturnTimeMachine} setSideShow={props.setSideShow} /> : <></>}

                            {props.user.Role === "Manager" ? <ManagerSidebar setSideShow={props.setSideShow} /> : <></>}

                            <Nav className="justify-content-end flex-grow-1 pe-3 mt-4">
                                <NavDropdown.Divider />
                                <Nav.Link className="nav-subtitle" onClick={handleTelegram}><Telegram style={{ marginTop: '-3px', fontSize: '21px' }} /> Join our Telegram channel</Nav.Link>
                            </Nav>

                        </Offcanvas.Body>



                        {props.user.Role === "Client" ? <WelcomeFarmerSidebar className="mt-4 side-farmer" /> : <></>}
                        {props.user.Role === "Farmer" ? <WelcomeFarmerSidebar className="mt-4 side-farmer" /> : <></>}
                        {props.user.Role === "Manager" ? <WelcomeFarmerSidebar className="mt-4 side-farmer" /> : <></>}

                    </Navbar.Offcanvas>
                </>}

            </Container >
        </Navbar >

    );
};

function TimeMachine(props) {

    const now_time = new Object();
    const now_date = new Object();
    now_time.value = dayjs().format('HH:mm');
    now_date.value = dayjs().format('YYYY-MM-DD');
    var newdate = "";

    const [time, setTime] = useState(now_time);
    const [date, setDate] = useState(now_date);


    function onSubmit() {
        newdate = (dayjs(date.value).format('MM-DD-YYYY') + " " + time.value + ":00").toString();
        API.setTimeMachine(newdate);
        props.onHide(newdate);

        if (dayjs(date.value).day() === 1 && time.value === "09:00") {
            window.location.reload(false);
        }
    }

    return (
        <Modal {...props} size="lg" aria-labelledby="contained-modal-title-vcenter" centered>
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    Wait a minute, Doc.
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <h6 style={{ textAlign: 'center' }}>
                    Are you telling me you built a time machine...out of a DeLorean?
                </h6>
                <Form>
                    <Row className="mt-3">
                        <DeLorean />
                    </Row>
                    <Row className="justify-content-center">
                        <Col lg={3} xl={3} md={3} sm={6} xs={6}>
                            <Form.Group className="mt-2" controlId="chosendate">
                                <Form.Label>Date</Form.Label>
                                <Form.Control type="date" defaultValue={date.value.toString()} onChange={e => setDate({ value: e.target.value })} />
                            </Form.Group>
                        </Col>
                        <Col lg={3} xl={3} md={3} sm={6} xs={6}>
                            <Form.Group className="mt-2" controlId="chosentime">
                                <Form.Label>Time</Form.Label>
                                <Form.Control type="time" defaultValue={time.value.toString()} onChange={e => setTime({ value: e.target.value })} />
                            </Form.Group>
                        </Col>
                        <Row className="justify-content-center mt-3" style={{ fontSize: '12px' }}>
                            • Set from Saturday at 09:00 to Sunday 23:00 to place an order.
                        </Row>
                        <Row className="justify-content-center mt-1" style={{ fontSize: '12px' }}>
                            • Set from Sunday at 23:00 to Monday 09:00 to confirm products as a Farmer.
                        </Row>
                        <Row className="justify-content-center mt-1" style={{ fontSize: '12px' }}>
                            • Set Saturday at 09:00 to send Telegram notifications.
                        </Row>
                        <Row className="justify-content-center mt-1" style={{ fontSize: '12px' }}>
                            • Set Monday at 09:00 to process open orders to pending.
                        </Row>
                        <Row className="justify-content-center mt-1" style={{ fontSize: '12px' }}>
                            • Set Friday at 19:00 to process uncollected orders and close them.
                        </Row>
                    </Row>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="warning" onClick={onSubmit}>Set Time</Button>
            </Modal.Footer>
        </Modal>
    );
}


function EmployeeSidebar(props) {
    const history = useHistory();

    return (
        <>
            <Offcanvas.Title className="mt-3 nav-subtitle"><BoxSeam style={{ marginTop: '-3px' }} />  ORDERS</Offcanvas.Title>
            <NavDropdown.Divider />

            <Nav className="justify-content-end flex-grow-1 pe-3">
                <Nav.Link className="sidebar-text" onClick={() => { props.setSideShow(false); history.push('/orders/all'); }} >All</Nav.Link>
                <Nav.Link className="sidebar-text" onClick={() => { props.setSideShow(false); history.push('/orders/open'); }}>Open</Nav.Link>
                <Nav.Link className="sidebar-text" onClick={() => { props.setSideShow(false); history.push('/orders/pending'); }}>Pending</Nav.Link>
                <Nav.Link className="sidebar-text" onClick={() => { props.setSideShow(false); history.push('/orders/closed'); }}>Closed</Nav.Link>
                <Nav.Link className="sidebar-text" onClick={() => { props.setSideShow(false); history.push('/orders/cancelled'); }}>Cancelled</Nav.Link>
            </Nav>

            <Offcanvas.Title className="mt-3 nav-subtitle"><PersonVideo2 style={{ marginTop: '-3px' }} />  CLIENTS</Offcanvas.Title>
            <NavDropdown.Divider />

            <Nav className="justify-content-end flex-grow-1 pe-3">
                <Nav.Link className="sidebar-text" onClick={() => { props.setSideShow(false); history.push('/clients'); }} >All clients</Nav.Link>
                <Nav.Link className="sidebar-text" onClick={() => { props.setSideShow(false); history.push('/signupClient'); }}>New client</Nav.Link>
            </Nav>
            <Offcanvas.Title className="mt-3 nav-subtitle"><Bucket style={{ marginTop: '-5px' }} />  FARMERS</Offcanvas.Title>
            <NavDropdown.Divider />

            <Nav className="justify-content-end flex-grow-1 pe-3">
                <Nav.Link className="sidebar-text" onClick={() => { props.setSideShow(false); history.push('/farmers'); }} >All farmers</Nav.Link>
                <Nav.Link className="sidebar-text" role="Farmer" onClick={() => { props.setSideShow(false); history.push('/signupEmployee'); }}>New farmer</Nav.Link>
            </Nav>
        </>
    );
}
function FarmerSidebar(props) {
    const history = useHistory();
    let giorno = dayjs(props.ReturnTimeMachine(), "MM-DD-YYYY HH:mm:ss");
    let confirmable = (giorno.day() === 0 && giorno.hour() >= 23) || (giorno.day() === 1 && giorno.hour() < 9)

    return (
        <>
            <Offcanvas.Title className="mt-3 nav-subtitle"><Bucket style={{ marginTop: '-5px' }} />  PRODUCTS</Offcanvas.Title>
            <NavDropdown.Divider />

            <Nav className="justify-content-end flex-grow-1 pe-3">
                <Nav.Link className="sidebar-text" onClick={() => { props.setSideShow(false); history.push('/farmerview'); }}>My products</Nav.Link>
            </Nav>
            
            <Nav className="justify-content-end flex-grow-1 pe-3">
                <Nav.Link className="sidebar-text" onClick={() => { props.setSideShow(false); history.push('/productconfirm'); }}>Confirm availability</Nav.Link>
            </Nav> 

            <Offcanvas.Title className="mt-3 nav-subtitle"><PersonVideo2 style={{ marginTop: '-3px' }} />  PROFILE</Offcanvas.Title>
            <NavDropdown.Divider />

            <Nav className="justify-content-end flex-grow-1 pe-3">
                <Nav.Link className="sidebar-text" onClick={() => { props.setSideShow(false); history.push('/profile'); }}>My profile</Nav.Link>
            </Nav>

        </>
    );
}


function ClientSidebar(props) {
    const history = useHistory();
    return (
        <>
            <Offcanvas.Title className="mt-3 nav-subtitle"><BoxSeam style={{ marginTop: '-3px' }} /> ORDERS</Offcanvas.Title>
            <NavDropdown.Divider />

            <Nav className="justify-content-end flex-grow-1 pe-3">
                <Nav.Link className="sidebar-text" onClick={() => { props.setSideShow(false); history.push('/myorders'); }}>My orders</Nav.Link>
            </Nav>

            <Offcanvas.Title className="mt-3 nav-subtitle"><PersonVideo2 style={{ marginTop: '-3px' }} />  PROFILE</Offcanvas.Title>
            <NavDropdown.Divider />

            <Nav className="justify-content-end flex-grow-1 pe-3">
                <Nav.Link className="sidebar-text" onClick={() => { props.setSideShow(false); history.push('/profile'); }}>My profile</Nav.Link>
            </Nav>

        </>
    );
}

function ManagerSidebar(props) {
    const history = useHistory();
    return (
        <>
            <Offcanvas.Title className="mt-3 nav-subtitle"><Kanban style={{ marginTop: '-3px' }} /> Managing</Offcanvas.Title>
            <NavDropdown.Divider />

            <Nav className="justify-content-end flex-grow-1 pe-3">
                <Nav.Link className="sidebar-text" onClick={() => { props.setSideShow(false); history.push('/manager'); }}>Unretrieved orders</Nav.Link>
            </Nav>
        </>
    );
}

export default ZeroNavbar;

