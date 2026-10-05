const express = require('express');
require('dotenv').config()
const mysql = require('mysql');
var sha1 = require('sha1');
var cors = require('cors')

const app = express();
app.use(cors()) // Adds headers: Access-Control-Allow-Origin: *
const port = 5500;
const pwdRegExp = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

var pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: '',
  port: 3306,
  database: 'weather_app', // TODO: cseréld a saját adatbázisod nevére
  timezone: 'Europe/Budapest'
});

app.get('/', (_req, res) => {
  res.send('Hello World!');
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Users ENDPOINTS
//Registration
//-------------------------------------------
app.post('/users/register', (req, res) => {
    const { name, email, password, confirm } = req.body;
    if (!name || !email || !password || !confirm) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    if (password !== confirm){
        return res.status(400).json ({error: 'Passwords do not match'});
    }

    
    //TODO: check password strenght 
    if (!password.match(pwdRegExp)){
        return res.status(400).json({ error: 'The new password is too weak!'})
    }

    //Check if email already exist
    pool.query('SELECT * FROM users WHERE email = ?', [email], (error, results) => {
        if (error){
            return res.status(500).json({error: 'Database query error'});
        }
        if (results.length > 0){
            return res.status(400).json({error: 'This e-mail already exists'});
        }
        pool.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, SHA1(?), "user")', [name, email, password], (error, results) =>{
            if(error){
                return res.status(500).json({error:'Database query error'});
            }
            res.status(201).json({message: 'User registered sucessfully'});
        });
    });
});

//login
app.post('/users/login', (req, res) => {
  const {email, password} = req.body;

  if(!email || !password){
    return res.status(400).json({ error: 'Missing fields.' });
  }
  //check that email is in the database
  pool.query('SELECT * FROM users WHERE email=? AND password=SHA1(?)', [email, password], (error, results) => {
    if(error){
      return res.status(500).json({error: 'Database query error.'});
    }
    if (results.length == 0){
      return res.status(400).json({error: 'Invalid credentials!'});

    }

    //TODO: Check user is active?
    if(results[0].is_active == 0){
      return res.status(400).json({error: 'This user is banned by admin.'});
    }
    
    const loggedUser = {
      ID: results[0].ID,
      name: results[0].name,
      email: results[0].email,
      role: results[0].role
    };
    pool.query('UPDATE users set last_login=CURRENT_TIMESTAMP, login_count=login_count+1 WHERE ID=?', [results[0].ID], (error, results) => {
    if(error){
      return res.status(500).json({error: 'Database query error.'});
    }
    //TODO: send logged user data to frontend
    return res.status(200).json({message: 'You are successfully logged in!', loggedUser});
    })
    //return res.status(200).json({message: 'You are successfully logged in!'});
  })
  
  
});

//password change
app.post('/users/:uID/password', (req,res) => {
  const {oldpassword, newpassword, confirm} = req.body; //átvesszük a frontendből érkező adatokat.
  const uID = req.params.uID
  if (!oldpassword || !newpassword || !confirm){
    return res.status(400).json({error: 'Missing fields.'});
  }
  if (newpassword != confirm){
    return res.status(400).json({error: 'The new password and it\'s confirm doesn\'t match!'});
  }
  if (oldpassword == newpassword){
    return res.status(400).json({error: 'The newpassword can\'t be the same with the old one.'});
  }
  //TODO: newpassword strenght check with regular expression.
  pool.query('SELECT * FROM users WHERE ID=?', [uID], (error, results) =>{
    if (error){
      return res.status(500).json({error: 'Database query error'});
    }
    if (results.length == 0){
      return res.status(400).json({error: 'This user doesn\'t exists!'});
    }
    const oldpassHash = sha1(oldpassword);
    if (results[0].password != oldpassHash){
      return res.status(400).json({error: 'The old password is not correct.'})
    }
    pool.query('UPDATE users SET password=SHA1(?) WHERE ID=?', [newpassword, uID], (error, results) => {
      if (error){
        return res.status(500).json ({error: 'Database query error.'});
      }
      return res.status(200).json({message: 'The password modified successfully!'});
    })
  })
});

//get profile
app.get('/users/:uid/', (req , res) => {
  const uid = req.params.uid;

  if(!uid){
    return res.status(400).json({error: 'Missing user identifier.'});
  }

  pool.query('SELECT * FROM users WHERE ID=?', [uid], (error, results) => {
     if (error){
            return res.status(500).json({error: 'Database query error'});
     }
     if (results.length == 0){
      return res.status(400).json({error: 'User with this ID doesn\'t exist!'});
     }

     let user ={
            "name": results[0].name,
            "email": results[0].email,
            "role": results[0].role,
            "created_at": results[0].created_at,
     }
     return res.status(200).json({results: user});
  })
})

//update profile
app.patch('/users/:uid', (req, res) => {
  const uid = req.params.uid;
  const {username, email, luid} = req.body;
  if(!uid || !username || !email || !luid){
    return res.status(400).json({error: 'Missing fields identifiers.'});
  }
  
  if (uid!=luid){
    return res.status(400).json({error: 'You don\'t have permission to update this user!'});
  }
  pool.query('SELECT * FROM users WHERE ID=?', [uid], (error, results) => {
    if (error){
      return res.status(500).json({error: 'Database query error.'});
    }
    if (results.length == 0){
      return res.status(400).json({error: 'User with this ID doesnt exist!'});
    }
    if ((username == results[0].name) && (email == results[0].email)){
      return res.status(200).json({message: 'No update occured!'});
    } 
    pool.query('SELECT * FROM users WHERE email=? AND ID<>?', [email, uid], (error, results2) => {
      if (error){
      return res.status(500).json({error: 'Database query error.'});
      }
      if (results2.length > 0){
        return res.status(400).json({error: 'This e-mail address is already used!'});
      }
      pool.query('UPDATE users SET name=?, email=?, updated_at=CURRENT_TIMESTAMP WHERE ID=?', [username, email, uid], (error, results3) =>{
        if (error){
          return res.status(500).json({error: 'Database query error.'});
        }
        return res.status(200).json({message: 'User updated successfully!'});
      })
    })
  })

});

//delete profile
app.delete('/users/:uid/', (req, res) => {
  const uid = req.params.uid;
  const loggedUserID = req.body.luid;

  if(!uid || !loggedUserID){
    return res.status(400).json({error: 'Missing user identifier.'});
  }
  if (uid!=loggedUserID){
    return res.status(400).json({error: 'You don\'t have permission to delete this user!'});
  }
  pool.query('DELETE FROM users WHERE ID=?', [uid], (error, results) => {
    if (error){
      return res.status(500).json({error: 'Database query error.'})
    }
    if (results.affectedRows == 1){
            return res.status(200).json({message: 'Profile deleted successfully!'});
        }
        return res.status(200).json({error: 'No deletion occurred.'});
  })
})


//WEATHER FORECAST ENDPOINTS
//get forecast list - Vendég is elérheti, csak limitált mezőkkel
//----------------------------------------------------------------
app.get('/weather', (req, res) => {
  pool.query(
    'SELECT ID, date, location, temp_min, temp_max, weather_type FROM weather_forecasts ORDER BY date ASC',
    (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Database query error.' });
      }
      return res.status(200).json(results);
    }
  );
});

//get single day detailed forecast - csak bejelentkezett user/admin (luid alapján)
app.post('/weather/:fid', (req, res) => {
  const fid = req.params.fid;
  const luid = req.body.luid;

  if (!fid || !luid) {
    return res.status(400).json({ error: 'Missing fields.' });
  }

  pool.query('SELECT * FROM users WHERE ID=?', [luid], (error, results1) => {
    if (error) {
      return res.status(500).json({ error: 'Database query error.' });
    }
    if (results1.length == 0) {
      return res.status(400).json({ error: 'User with this ID doesn\'t exist!' });
    }

    pool.query('SELECT * FROM weather_forecasts WHERE ID=?', [fid], (error, results2) => {
      if (error) {
        return res.status(500).json({ error: 'Database query error.' });
      }
      if (results2.length == 0) {
        return res.status(400).json({ error: 'Forecast with this ID doesn\'t exist!' });
      }
      return res.status(200).json(results2[0]);
    });
  });
});

//ADMIN WEATHER ENDPOINTS
//list all forecasts, every field, admin táblázathoz
app.post('/admin/weather', (req, res) => {
  const luid = req.body.luid;
  if (!luid) {
    return res.status(400).json({ error: 'Missing fields.' });
  }

  pool.query('SELECT * FROM users WHERE ID=?', [luid], (error, results1) => {
    if (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (results1.length == 0) {
      return res.status(400).json({ error: 'User with this ID doesnt exist!' });
    }
    if (results1[0].role != 'admin') {
      return res.status(403).json({ error: 'Dont have permission!' });
    }

    pool.query('SELECT * FROM weather_forecasts ORDER BY date DESC', (error, results) => {
      if (error) {
        return res.status(500).json({ error: 'Internal server error' });
      }
      return res.status(200).json(results);
    });
  });
});

//create new forecast
app.post('/admin/weather/new', (req, res) => {
  //Összes adatot bekérjük a frontendtől.
  const {
    luid, date, location, temp_min, temp_max, weather_type,
    precipitation, precipitation_probability, wind_speed,
    wind_direction, humidity, pressure, uv_index
  } = req.body;

  if (!luid || !date || !location || temp_min == null || temp_max == null || !weather_type) {
    return res.status(400).json({ error: 'Missing fields.' });
  }
  if (temp_min > temp_max) {
    return res.status(400).json({ error: 'The minimum temperature can\'t be higher than the maximum!' });
  }

  pool.query('SELECT * FROM users WHERE ID=?', [luid], (error, results1) => {
    if (error) {
      return res.status(500).json({ error: 'Database query error.' });
    }
    if (results1.length == 0) {
      return res.status(400).json({ error: 'User with this ID doesnt exist!' });
    }
    if (results1[0].role != 'admin') {
      return res.status(403).json({ error: 'Dont have permission!' });
    }

    //Adatbázis művelet. ? jelek behelyetesítő értékek.
    pool.query(
      `INSERT INTO weather_forecasts
        (date, location, temp_min, temp_max, weather_type, precipitation, precipitation_probability, wind_speed, wind_direction, humidity, pressure, uv_index)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        date, location, temp_min, temp_max, weather_type,
        precipitation || 0, precipitation_probability || 0, wind_speed || 0,
        wind_direction || '', humidity || 0, pressure || 0, uv_index || 0
      ],
      (error, results) => {
        if (error) {
          return res.status(500).json({ error: 'Database query error.' });
        }
        return res.status(201).json({ message: 'Forecast added successfully!' });
      }
    );
  });
});

//update forecast
app.patch('/admin/weather/:fid', (req, res) => {
  const fid = req.params.fid;

  //Szintén az összeset bekérjük.
  const {
    luid, date, location, temp_min, temp_max, weather_type,
    precipitation, precipitation_probability, wind_speed,
    wind_direction, humidity, pressure, uv_index
  } = req.body;

  if (!fid || !luid || !date || !location || temp_min == null || temp_max == null || !weather_type) {
    return res.status(400).json({ error: 'Missing fields.' });
  }
  if (temp_min > temp_max) {
    return res.status(400).json({ error: 'The minimum temperature can\'t be higher than the maximum!' });
  }

  pool.query('SELECT * FROM users WHERE ID=?', [luid], (error, results1) => {
    if (error) {
      return res.status(500).json({ error: 'Database query error.' });
    }
    if (results1.length == 0) {
      return res.status(400).json({ error: 'User with this ID doesnt exist!' });
    }
    if (results1[0].role != 'admin') {
      return res.status(403).json({ error: 'Dont have permission!' });
    }

    pool.query('SELECT * FROM weather_forecasts WHERE ID=?', [fid], (error, results2) => {
      if (error) {
        return res.status(500).json({ error: 'Database query error.' });
      }
      if (results2.length == 0) {
        return res.status(400).json({ error: 'Forecast with this ID doesnt exist!' });
      }

      //Adatbázis művelettel update-jük.
      pool.query(
        `UPDATE weather_forecasts SET
           date=?, location=?, temp_min=?, temp_max=?, weather_type=?,
           precipitation=?, precipitation_probability=?, wind_speed=?, wind_direction=?,
           humidity=?, pressure=?, uv_index=?, updated_at=CURRENT_TIMESTAMP
         WHERE ID=?`,
        [
          date, location, temp_min, temp_max, weather_type,
          precipitation || 0, precipitation_probability || 0, wind_speed || 0,
          wind_direction || '', humidity || 0, pressure || 0, uv_index || 0, fid
        ],
        (error, results3) => {
          if (error) {
            return res.status(500).json({ error: 'Database query error.' });
          }
          return res.status(200).json({ message: 'Forecast updated successfully!' });
        }
      );
    });
  });
});

//delete forecast
app.delete('/admin/weather/:fid', (req, res) => {
  const fid = req.params.fid;
  const luid = req.body.luid;

  if (!fid || !luid) {
    return res.status(400).json({ error: 'Missing fields.' });
  }

  pool.query('SELECT * FROM users WHERE ID=?', [luid], (error, results1) => {
    if (error) {
      return res.status(500).json({ error: 'Database query error.' });
    }
    if (results1.length == 0) {
      return res.status(400).json({ error: 'User with this ID doesnt exist!' });
    }
    if (results1[0].role != 'admin') {
      return res.status(403).json({ error: 'Dont have permission!' });
    }

    pool.query('DELETE FROM weather_forecasts WHERE ID=?', [fid], (error, results2) => {
      if (error) {
        return res.status(500).json({ error: 'Database query error.' });
      }
      if (results2.affectedRows == 1) {
        return res.status(200).json({ message: 'Forecast deleted successfully!' });
      }
      return res.status(400).json({ error: 'No deletion occurred.' });
    });
  });
});


//ADMIN USER ENDPOINTS
//get all users
app.post('/admin/users', (req, res) => {
  const luid = req.body.luid;
  if (!luid) {
    return res.status(400).json({error: 'Missing fields.'});
  }

  pool.query('SELECT * FROM users WHERE ID=?', [luid], (error, results1) => {
    if (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (results1.length == 0){
      return res.status(400).json({error: 'User with this ID doesnt exist!'});
    }
    if (results1[0].role != 'admin'){
      return res.status(400).json({error: 'Dont have permission!'});
    }
    pool.query('SELECT * FROM users', (error, results) =>{
      if (error) {
        return res.status(500).json({ error: 'Internal server error' });
      }
      return res.status(200).json(results);
    })
  });
});

//deny user (tiltás / feloldás)
app.patch('/admin/status', (req, res) =>{
  const {uid, luid} = req.body;
  if (!uid || !luid){
    return res.status(400).json({error: 'Missing fields.'});
  }

  pool.query('SELECT * FROM users WHERE ID=?', [luid], (error, results) =>{
    if(error){
      return res.status(500).json({error: 'Database query error.'});
    }
    if (results.length == 0){
      return res.status(400).json({error: 'User with this ID doesnt exist!'});
    }
    if (results[0].role != 'admin'){
      return res.status(400).json({error: 'Dont have permission!'});
    }
    pool.query('SELECT * FROM users WHERE ID=?', [uid], (error, results1) =>{
    if(error){
      return res.status(500).json({error: 'Database query error.'});
    }
    if (results1.length == 0){
      return res.status(400).json({error: 'User with this ID doesnt exists!'});
    }

      pool.query('UPDATE users SET is_active = not is_active WHERE ID=?', [uid], (error, results2) =>{
        if(error){
          return res.status(500).json({error: 'Database query error.'});
        }
        return res.status(200).json({message: 'User status changed!'});
        })
      })
  });

  
})


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});