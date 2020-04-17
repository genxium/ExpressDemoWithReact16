'use-strict';

import React from 'react';
const constants = require('../../../common/constants');
const WebFunc = require('../../utils/WebFunc').default;

const LocaleManager = require('../../../common/LocaleManager').default;

import { Jumbotron, Container, Card, CardColumns, ListGroup, } from 'react-bootstrap';

import { FaSadCry, FaSadTear, FaRegSadCry, FaRegSadTear, FaAssistiveListeningSystems, FaNewspaper, FaCodeBranch, FaRegNewspaper, FaPhone, FaUserShield, FaPiggyBank, FaVideo, } from 'react-icons/fa';

import { View, Topbar, Button, pushNewScene, changeSceneTitle, } from '../../widgets/WebCommonRouteProps';

class Home extends React.Component {

  constructor(props) {
    super(props);
    const sceneRef = this;

    this.styles = {
      entryCommon: {
        display: 'block',
        marginTop: 5,
      },
    };

    this.state = {
      initialized: false,
    };
  }

  componentDidMount() {
    const sceneRef = this;
    changeSceneTitle(sceneRef, LocaleManager.instance.effectivePack().PLAYER_CONSOLE);
  }

  render() {
    const sceneRef = this;
    const {RoleLoginSingleton, ...other} = sceneRef.props;
    const styles = sceneRef.styles;

    const topbarProps = Object.assign({
      showLoginNav: false,
      onHasLoggedIn: () => {
        sceneRef.setState({
          initialized: true,
        });
      },
      onHasNotLoggedIn: () => {
        /*
        * Do not impose a "IntAuthTokenWall" on homepage, yet still provide a topbar for proactively triggering the action. 
        * We use ReactJs to build the homepage instead of a "static page (which in most cases easier for SEO)" because our existing "topbar utility (which features login state management)" was written in ReactJs.  
        * 
        * -- YFLu, 2020-02-02
        */
        // RoleLoginSingleton.instance.replaceRoleLoginScene(sceneRef);
      },
      sceneRef: sceneRef
    }, sceneRef.props);

    const topbarChildren = [];
    const topbar = (
    <Topbar {...topbarProps}>
      { topbarChildren }
    </Topbar>
    );

    /*
    * This cliparts should all be tailored to square aspect ratio, i.e. 1:1.
    */
    const quarrelClipartPath = constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.CLIPART + "/quarrel.jpg";
    const profilingClipartPath = constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.CLIPART + "/performance-testing.jpg";
    const deliveredClipartPath = constants.ROUTE_PATHS.BASE + constants.ROUTE_PATHS.CLIPART + "/delivered-1.png";

    const mainScene = (
    <View>
      <Jumbotron fluid>
        <Container>
          <h1>DGFluoresence</h1>
          <p>
            Providing software test automation, server stress diagonsis and solutions.
          </p>
        </Container>
      </Jumbotron>
      <CardColumns>
        <Card>
          <Card.Img
                    variant="top"
                    src={ quarrelClipartPath } />
          <Card.Body>
            <Card.Title>
              What your product may be sufferring from
            </Card.Title>
          </Card.Body>
          <ListGroup>
            <ListGroup.Item>
              <FaSadCry/> Lack of budget to have in-house test automation
            </ListGroup.Item>
            <ListGroup.Item>
              <FaSadTear/> Ambiguous arguments on critical but laggy features
            </ListGroup.Item>
            <ListGroup.Item>
              <FaRegSadCry/> Lack of experienced people to identify application bottleneck
            </ListGroup.Item>
            <ListGroup.Item>
              <FaRegSadTear/> Lack of experience to solve application bottleneck
            </ListGroup.Item>
          </ListGroup>
          <Card.Footer>
            <small className="text-muted">and more...</small>
          </Card.Footer>
        </Card>
        <Card>
          <Card.Img
                    variant="top"
                    src={ profilingClipartPath } />
          <Card.Body>
            <Card.Title>
              What we ship
            </Card.Title>
          </Card.Body>
          <ListGroup>
            <ListGroup.Item>
              <FaAssistiveListeningSystems/> Listen to your needs
            </ListGroup.Item>
            <ListGroup.Item>
              <FaNewspaper/> Reports and plans of our estimation to critical cases that need testing
            </ListGroup.Item>
            <ListGroup.Item>
              <FaCodeBranch/> Codes or devops scripts for test automation cass, stress relieving, at any phase of development
            </ListGroup.Item>
            <ListGroup.Item>
              <FaRegNewspaper/> Reports of the improvement
            </ListGroup.Item>
          </ListGroup>
          <Card.Footer>
            <small className="text-muted">and more...</small>
          </Card.Footer>
        </Card>
        <Card>
          <Card.Img
                    variant="top"
                    src={ deliveredClipartPath } />
          <Card.Body>
            <Card.Title>
              Who we served
            </Card.Title>
          </Card.Body>
          <ListGroup>
            <ListGroup.Item>
              <FaPhone/> International Telcom companies
            </ListGroup.Item>
            <ListGroup.Item>
              <FaUserShield/> Domestic security Bureau
            </ListGroup.Item>
            <ListGroup.Item>
              <FaPiggyBank/> Domestic & international banks
            </ListGroup.Item>
            <ListGroup.Item>
              <FaVideo/> International video conferencing vendor
            </ListGroup.Item>
          </ListGroup>
          <Card.Footer>
            <small className="text-muted">and more...</small>
          </Card.Footer>
        </Card>
      </CardColumns>
    </View>
    );

    return (
      <View>
        { mainScene }
      </View>
    );
  }
}

export default Home;
