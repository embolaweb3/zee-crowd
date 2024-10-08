"use client"

import Head from "next/head";
import { useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import ConnectWallet from "../app/components/ConnectWallet";
import CreateCampaign from "../app/components/CreateCampaign";
import CampaignList from "../app/components/CampaignList";
import { ToastContainer } from 'react-toastify';


export default function Home() {
  const [account, setAccount] = useState("");

  const handleConnect = (connectedAccount) => {
    setAccount(connectedAccount);
  };

  return (
    <Container>
      <Head>
        <title>ZEE Crowd</title>
      </Head>
      <Row className="justify-content-center">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

        <Col md={8}>
          <Card className="mt-5 shadow-lg p-3 mb-5 bg-white rounded animate__animated animate__fadeIn">
            <Card.Body>
              <h1 className="text-center">Welcome to ZEE Crowdfunding DApp</h1>
              <ConnectWallet onConnect={handleConnect} />
              {account && <CreateCampaign />}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col md={8}>
          {account && <CampaignList />}
        </Col>
      </Row>
    </Container>
  );
}
