import React from 'react';

import './EventItem.css';

const eventItem = props => (
  <li key={props.eventId} className="events__list-item">
    <div>
      <h1>{props.title}</h1>
      <h2>${props.price} - {new Date(props.date).toLocaleDateString()}</h2>
    </div>
    <div>
      {props.userId === props.creatorId ? <p>You are the creator of this event</p> : <button className="btn" onClick={props.onDetailsClick.bind(this, props.eventId)}>View Details</button>}
      {/* Edit or Delete if you are the owner of the Event */}
    </div>
  </li>
);

export default eventItem;