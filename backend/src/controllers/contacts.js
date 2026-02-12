import Contact from '../models/Contact.js';

export async function searchContacts(req, res) {
  try {
    const { searchTerm } = req.body;

    if (!searchTerm) {
      res.status(400).json({ message: "Search term is required" });
      return;
    }

    const searchRegex = new RegExp(searchTerm, 'i');
    const contacts = await Contact.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ]
    });

    res.status(200).json(contacts);
  } catch (error) {
    console.error("Error in searchContacts controller: ", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

export async function getAllContacts(_, res) {
  try {
    const contacts = await Contact.find();
    res.status(200).json(contacts);
  } catch (error) {
    console.error("Error in getAllContacts controller: ", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

export async function getContactsForList(_, res) {
  try {
    const contacts = await Contact.find({}, '_id firstName lastName email');
    res.status(200).json(contacts);
  } catch (error) {
    console.error("Error in getContactsForList controller: ", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

export async function deleteContact(req, res) {
  try {
    const { dmId } = req.params;

    if (!dmId) {
      res.status(400).json({ message: "Contact ID is required" });
      return;
    }

    const deletedContact = await Contact.findByIdAndDelete(dmId);

    if (!deletedContact) {
      res.status(400).json({ message: "Contact not found" });
      return;
    }

    res.status(200).json({ message: "Contact deleted successfully" });
  } catch (error) {
    console.error("Error in deleteContact controller: ", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}
