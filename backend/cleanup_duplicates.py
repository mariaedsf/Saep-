#!/usr/bin/env python
import os
import sys
import django
from django.db import connection
from django.contrib.auth import get_user_model

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saep.settings')
django.setup()

User = get_user_model()

def find_and_cleanup_duplicate_users():
    """
    Find and clean up duplicate users based on email.
    Keeps the most recently created user and removes duplicates.
    """
    print("Finding duplicate users...")
    
    # Find duplicate emails
    duplicate_emails = []
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT email, COUNT(*) as count 
            FROM api_usuario 
            GROUP BY email 
            HAVING COUNT(*) > 1
        """)
        duplicate_emails = [row[0] for row in cursor.fetchall()]
    
    print(f"Found {len(duplicate_emails)} emails with duplicates:")
    
    total_deleted = 0
    
    for email in duplicate_emails:
        print(f"\nProcessing email: {email}")
        
        # Get all users with this email, ordered by creation date (newest first)
        users = User.objects.filter(email=email).order_by('-date_joined')
        
        if users.count() > 1:
            print(f"  Found {users.count()} users with email {email}")
            
            # Keep the first (newest) user, delete the rest
            users_to_delete = users[1:]
            kept_user = users[0]
            
            print(f"  Keeping user: {kept_user.username} (ID: {kept_user.id}, Created: {kept_user.date_joined})")
            
            for user_to_delete in users_to_delete:
                print(f"  Deleting user: {user_to_delete.username} (ID: {user_to_delete.id}, Created: {user_to_delete.date_joined})")
                user_to_delete.delete()
                total_deleted += 1
    
    print(f"\nCleanup complete. Deleted {total_deleted} duplicate users.")
    
    # Verify no duplicates remain
    remaining_duplicates = 0
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT email, COUNT(*) as count 
            FROM api_usuario 
            GROUP BY email 
            HAVING COUNT(*) > 1
        """)
        remaining_duplicates = len(cursor.fetchall())
    
    print(f"Remaining duplicate emails: {remaining_duplicates}")
    
    if remaining_duplicates == 0:
        print("✅ All duplicates have been successfully removed!")
    else:
        print("⚠️  Some duplicates remain. Manual cleanup may be required.")

if __name__ == '__main__':
    find_and_cleanup_duplicate_users()