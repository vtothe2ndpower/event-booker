import React, { Component } from 'react';

import Modal from '../components/Modal/Modal';
import Backdrop from '../components/Backdrop/Backdrop';
import EventList from '../components/Events/EventList/EventList';
import AuthContext from '../context/auth-context';
import Spinner from '../components/Spinner/Spinner';

import './Events.css';

class EventsPage extends Component {
  state = {
    isCreating: false,
    isLoading: false,
    events:[],
    selectedEvent: null
  };

  static contextType = AuthContext;

  constructor(props) {
    super(props);
    this.titleEl = React.createRef();
    this.priceEl = React.createRef();
    this.dateEl = React.createRef();
    this.descriptionEl = React.createRef();
  }

  componentDidMount() {
    this.fetchEvents();
  }

  handleCreateEvent = () => {
    this.setState({ isCreating: true });
  }

  handleCancel = () => {
    this.setState({ isCreating: false, selectedEvent: null });
  }

  handleConfirm = () => {
    this.setState({ isCreating: false });
    const title = this.titleEl.current.value;
    const price = +this.priceEl.current.value;
    const date = this.dateEl.current.value;
    const description = this.descriptionEl.current.value;

    if (title.trim().length === 0 || price <= 0 || date.trim().length === 0 || description.trim().length === 0) {
      return;
    }

    const event = { title, price, date, description };
    console.log(event);

    const requestBody = {
      query: `
        mutation {
          createEvent(eventInput: { title: "${title}", description: "${description}", price: ${price}, date: "${date}"}) {
            _id
            title
            description
            date
            price
          }
        }
     `
    };

    const token = this.context.token;

    fetch('http://localhost:8000/graphql', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    })
    .then(res => {
      if (res.status !== 200 && res.status !== 201) {
        throw new Error('Failed!');
      }
      return res.json();
    })
    .then(resData => {
      this.setState(prevState => {
        const updatedEvents = [...prevState.events];
        updatedEvents.push({            
          _id: resData.data.createEvent._id,
          title: resData.data.createEvent.title,
          description: resData.data.createEvent.description,
          date: resData.data.createEvent.date,
          price: resData.data.createEvent.price,
          creator: {
            _id: this.context.userId
          }
        });
        return { events: updatedEvents };
      });
    })
    .catch(err => {
      console.log(err);  
    });
  }

  fetchEvents = () => {
    this.setState({ isLoading: true });
    const requestBody = {
      query: `
        query {
          events { 
            _id
            title
            description
            date
            price
            creator {
              _id
              email
            }
          }
        }
     `
    };

    fetch('http://localhost:8000/graphql', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(res => {
      if (res.status !== 200 && res.status !== 201) {
        throw new Error('Failed!');
      }
      return res.json();
    })
    .then(resData => {
      const events = resData.data.events;
      this.setState({ events: events, isLoading: false });
    })
    .catch(err => {
      console.log(err);  
      this.setState({ isLoading: false });
    });
  }

  handleDetailsClick = eventId => {
    this.setState(prevState => {
      const selectedEvent = prevState.events.find(e => e._id === eventId);

      return { ...prevState, selectedEvent: selectedEvent };
    });
  }

  handleBookEvent = () => {
    console.log('hi');
  }

  render() {
    return (
      <React.Fragment>
        {(this.state.isCreating || this.state.selectedEvent) && <Backdrop />}
        {this.state.isCreating && <Modal title="Add Event" canCancel canConfirm onCancel={this.handleCancel} onConfirm={this.handleConfirm} confirmText="Confirm">
          <form action="">
            <div className="form-control">
              <label htmlFor="title">Title</label>
              <input type="text" id="title" ref={this.titleEl} />
            </div>
            <div className="form-control">
              <label htmlFor="price">Price</label>
              <input type="number" id="price" ref={this.priceEl} />
            </div>
            <div className="form-control">
              <label htmlFor="date">Date</label>
              <input type="datetime-local" id="date" ref={this.dateEl} />
            </div>
            <div className="form-control">
              <label htmlFor="description">Description</label>
              <textarea id="description" rows="4" ref={this.descriptionEl} />
            </div>
          </form>
        </Modal>}
        {this.state.selectedEvent && (
        <Modal 
          title={this.state.selectedEvent.title} 
          canCancel 
          canConfirm 
          onCancel={this.handleCancel} 
          onConfirm={this.handleBookEvent}
          confirmText="RSVP"
        >
          <h1>{this.state.selectedEvent.title}</h1>
          <h2>
            ${this.state.selectedEvent.price} - {new Date(this.state.selectedEvent.date).toLocaleDateString()}
          </h2>
          {/* Include Image Here */}
          <p>{this.state.selectedEvent.description}</p>
        </Modal>
        )}
        {this.context.token && (
        <div className="events-control">
          <p>Know of another Event? List it here!</p>
          <button className="btn" onClick={this.handleCreateEvent}>Create Event</button>
        </div> 
        )}
        {this.state.isLoading ? <Spinner /> :
        <EventList 
          events={this.state.events} 
          authUserId={this.context.userId} 
          handleDetailsClick={this.handleDetailsClick}
        />
        }
      </React.Fragment>
    );
  }
}

export default EventsPage;