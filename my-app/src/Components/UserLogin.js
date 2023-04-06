import { Col, Row, Container, Form, Button, Toast, ToastContainer, Image } from 'react-bootstrap';
import { Modal } from 'react-bootstrap';
import { useState } from 'react';
import "./UserLogin.css";


function UserLogin(props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [toastEmail, setToastEmail] = useState(false);
    const [toastPassword, setToastPassword] = useState(false);
    const [toastPasswordAndEmail, setToastPasswordAndEmail] = useState(false);

    const [loginResponseModal, setLoginResponseModal] = useState(false);
    const handleLoginResponseModalShow = () => setLoginResponseModal(true);
    const handleLoginResponseModalClose = () => setLoginResponseModal(false);



    function validform(event) {
        event.preventDefault();
        if (!password && password.length <= 0 && !email && email.length <= 0) {
            setToastPasswordAndEmail(true);
        } else if (!password && password.length <= 0) {
            setToastPassword(true);
        } else if (!email && email.length <= 0) {
            setToastEmail(true);
        } else {
            sendRegister(event);
        }
    }

    async function sendRegister(event) {
        event.preventDefault();
        props.login(email, password)
            .catch((err) => {
                handleLoginResponseModalShow();
            })
    }

    return (
        <Container>
            {toastEmail && (
                <ToastContainer position="middle-center">
                    <Toast onClose={() => setToastEmail(false)} delay={5000} autohide>
                        <Toast.Header>
                            <strong className="me-auto">Warning</strong>
                        </Toast.Header>
                        <Toast.Body>Please enter your email</Toast.Body>
                    </Toast>
                </ToastContainer>
            )}

            {toastPassword && (
                <ToastContainer position="middle-center">
                    <Toast onClose={() => setToastPassword(false)} delay={5000} autohide position="middle-center">
                        <Toast.Header>
                            <strong className="me-auto">Warning</strong>
                        </Toast.Header>
                        <Toast.Body>Please enter your password</Toast.Body>
                    </Toast>
                </ToastContainer>
            )}

            {toastPasswordAndEmail && (
                <ToastContainer position="middle-center">
                    <Toast onClose={() => setToastPasswordAndEmail(false)} delay={5000} autohide position="middle-center">
                        <Toast.Header>
                            <strong className="me-auto">Warning</strong>
                        </Toast.Header>
                        <Toast.Body>Please enter your email and password</Toast.Body>
                    </Toast>
                </ToastContainer>
            )}

            <Row className="justify-content-center mt-3 mb-1">
                <Col xs={9} lg={4}>
                    <Row className="justify-content-center mt-3 mb-3">
                        <Image style={{ marginLeft: '-3px' }} id="logo" src="/images/logo.png" />
                        <h2 className="mt-1" style={{ textAlign: 'center' }}>We missed you!</h2>
                    </Row>
                    <LoginResponseModal loginResponseModal={loginResponseModal} handleLoginResponseModalClose={handleLoginResponseModalClose} />
                    <Form onSubmit={(e) => validform(e)}>
                        <Form.Group className="mb-4 distanza" controlId="formBasicEmail">
                            <Form.Label>Email</Form.Label>
                            <Form.Control type="email" placeholder="Enter email" onChange={(e) => setEmail(e.target.value)} />
                        </Form.Group>
                        <Row>
                            <Col>
                                <Form.Group className="mb-3" controlId="formBasicPassword">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
                                </Form.Group>
                            </Col>
                            <Col className="login-placement" xl={2} lg={2} md={2} sm={3} xs={3}><SubmitButton /></Col>
                        </Row>
                </Form>
            </Col>
        </Row>
        </Container >
    )
}


function LoginResponseModal(props) {
    return (
        <Modal show={props.loginResponseModal} onHide={props.handleLoginResponseModalClose} autoFocus={true} size="sm" centered>
            <Modal.Header closeButton>
                <Modal.Title>⚠️Login error</Modal.Title>
            </Modal.Header>
            <Modal.Body>
               Wrong username or password
            </Modal.Body>
            <Modal.Footer>
                <Col style={{ textAlign: 'center' }}>

                </Col>
            </Modal.Footer>
        </Modal>
    );
}

function SubmitButton(props) {

    return (
        <Button
            style={{ fontSize: '18px' }}
            type="submit"
            variant="warning"
            onClick={props.handleLoginResponseModalShow}
            size="sm"
        >
            Login
        </Button>
    );

}





export default UserLogin;