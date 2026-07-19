async function test() {
  try {
    // 1. Register a user
    const email = `test${Date.now()}@test.com`;
    console.log('Registering user...');
    let res = await fetch('http://localhost:5001/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email, password: 'password123', role: 'teacher', phone: Date.now().toString() })
    });
    if (!res.ok) throw new Error(await res.text());
    let data = await res.json();
    const token = data.accessToken;
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    // 2. Create a section
    console.log('Creating section...');
    res = await fetch('http://localhost:5001/sections', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Test Section', uniqueId: `TEST-${Date.now()}`, contactPhone: '1234567890' })
    });
    if (!res.ok) throw new Error(await res.text());
    data = await res.json();
    const sectionId = data._id;

    // 3. Create a semester
    console.log('Creating semester...');
    res = await fetch(`http://localhost:5001/sections/${sectionId}/semesters`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Semester 1' })
    });
    if (!res.ok) throw new Error(await res.text());
    data = await res.json();
    const semId = data._id;

    // 4. Create a course
    console.log('Creating course...');
    res = await fetch(`http://localhost:5001/sections/${sectionId}/semesters/${semId}/courses`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Course 1' })
    });
    if (!res.ok) throw new Error(await res.text());
    data = await res.json();
    const courseId = data._id;

    // 5. Presign upload
    console.log('Presigning upload...');
    res = await fetch(`http://localhost:5001/sections/${sectionId}/courses/${courseId}/materials/presign`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ fileName: 'test.txt', fileSize: 12, mimeType: 'text/plain' })
    });
    if (!res.ok) throw new Error(await res.text());
    data = await res.json();
    console.log('Presign success:', data);
    const { presignedUrl, materialId } = data;

    // 6. Upload file directly to R2
    console.log('Uploading to R2...');
    const uploadRes = await fetch(presignedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: 'Hello world!'
    });
    if (!uploadRes.ok) throw new Error(await uploadRes.text());
    console.log('Upload success:', uploadRes.status);

    // 7. Confirm
    console.log('Confirming upload...');
    res = await fetch(`http://localhost:5001/sections/${sectionId}/courses/${courseId}/materials/confirm`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ materialId })
    });
    if (!res.ok) throw new Error(await res.text());
    data = await res.json();
    console.log('Confirm success:', data._id);

  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
